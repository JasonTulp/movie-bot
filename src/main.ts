import { Ollama } from 'ollama'
import {marked} from "marked";

const chatContainer = document.getElementById("chat-container")!;
const userInput = document.getElementById("user-input") as HTMLInputElement;
const sendButton = document.getElementById("send-btn")!;

sendButton.addEventListener("click", sendMessage);
userInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
});

// "http://ollama-ip:11434"
const ollama = new Ollama({ host: import.meta.env.VITE_OLLAMA_API_URL })
let conversationHistory: { role: "user" | "assistant"; content: string }[] = [];
let accumulatedResponse = ""; // To store the accumulated response
let moviesToDownload: string[] = []; // To store the movies to download

//'http://radarr-ip:7878/api/v3'
const RADARR_API_URL = import.meta.env.VITE_RADARR_API_URL;

// Function to search for a movie in Radarr by title and request it to be downloaded
async function requestMoviesFromRadarr(movieTitles: string[]): Promise<void> {
    for (const title of movieTitles) {
        try {
            console.log("searching for movie: ", title);
            // Step 1: Search for the movie in Radarr
            const searchResponse = await fetch(`${RADARR_API_URL}/movie/lookup?apiKey=${import.meta.env.VITE_RADARR_API_KEY}&term=${encodeURIComponent(title)}`);
            const movies = await searchResponse.json();
            console.log("Movies found: ", movies.length, movies)

            // Step 2: Check if any movie was found
            if (movies.length === 0) {
                console.log(`Movie not found: ${title}`);
                continue;
            }

            // Assuming the first movie result is the correct one
            const movie = movies[0];

            // Step 3: Send a request to Radarr to add the movie to the download queue
            const addMovieResponse = await fetch(`${RADARR_API_URL}/movie`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Api-Key': import.meta.env.VITE_RADARR_API_KEY
                },
                body: JSON.stringify({
                    title: movie.title,
                    qualityProfileId: 4, // 1080P quality profile
                    rootFolderPath: "/movies",
                    monitored: true,
                    tmdbId: movie.tmdbId
                })
            });

            const addMovieData = await addMovieResponse.json();
            if (addMovieResponse.ok) {
                console.log(`Successfully requested movie: ${title}`);
                appendMessage("success", `Movie requested: ${title}`);
            } else {
                let alreadyExists = addMovieData.find((err: any) => err.errorCode === "MovieExistsValidator");
                // Report error to user, if movie already exists or other error
                // TODO better error handling lol
                if (alreadyExists) {
                    appendMessage("warning", `${title} already exists in the library`);
                } else {
                    appendMessage("error", `Error requesting: ${title}`);
                }
            }
        } catch (error) {
            console.error(`Error requesting movie: ${title}`, error);
        }
    }
}

// Send message to the chat bot
async function sendMessage() {
    const userMessage = userInput.value.trim();
    if (!userMessage) return;

    console.log("User message:", userMessage);
    // Add user message to history
    conversationHistory.push({ role: "user", content: userMessage });

    console.log("Conversation:", conversationHistory);
    appendMessage("user", userMessage);
    userInput.value = "";

    let hasMessageElement = false;
    let messageElement;

    try {
        const response = await ollama.chat({ model: import.meta.env.VITE_OLLAMA_MODEL_NAME, messages: conversationHistory, stream: true })

        let fullText = "";
        for await (const part of response) {
            // process.stdout.write(part.message.content)
            fullText += part.message.content;
            accumulatedResponse = handleDownloadRequest(fullText);
            if (!hasMessageElement && accumulatedResponse.length > 0) {
                messageElement = appendMessage("bot", "");
                hasMessageElement = true;
            }
            if (messageElement) {
                messageElement.innerHTML = convertToMarkdown(accumulatedResponse);
            }
        }

        // Add AI response to history
        conversationHistory.push({ role: "assistant", content: fullText });
        console.log("Movies to download:", moviesToDownload);

        if (moviesToDownload.length > 0) {
            await requestMoviesFromRadarr(moviesToDownload);
            moviesToDownload = [];
        }
    } catch (error) {
        console.error("Error:", error);
    }
}

// Function to check for download requests, prefixed by |:|
function handleDownloadRequest(responseText: string) {
    const downloadIndex = responseText.indexOf("|:|");

    if (downloadIndex !== -1) {
        // Extract the part before ||DOWNLOAD|| to display
        const filteredResponse = responseText.split("|:|")[0].trim();

        // Extract the part after ||DOWNLOAD|| and process it
        const downloadContent = responseText.slice(downloadIndex + "|:|".length).trim();

        try {
            // Try to parse the download content (it should be a JSON array)
            const newMovies = JSON.parse(downloadContent);
            moviesToDownload = newMovies;
        } catch (error) {
            // do nothing
            // console.log("JSON not complete");
        }

        return filteredResponse;
    }

    return responseText;
}

// Append message to the chat box
function appendMessage(sender: "user" | "bot" | "success" | "error" | "warning", text: string) {
    const messageElement = document.createElement("div");
    let extraStr = "";
    if (sender === "user") {
        extraStr = "bg-blue-500 text-white ml-auto";
    } else if (sender === "bot") {
        extraStr = "bg-gray-700 text-white mr-auto";
    } else if (sender === "success") {
        extraStr = "bg-green-500 text-white mr-auto";
    } else if (sender === "error") {
        extraStr = "bg-red-500 text-white mr-auto";
    } else if (sender === "warning") {
        extraStr = "bg-orange-500 text-white mr-auto";
    }
    messageElement.className = `p-2 rounded-lg w-[80%] break-words mb-2 ${extraStr}`;
    messageElement.innerHTML = convertToMarkdown(text);
    chatContainer.appendChild(messageElement);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    return messageElement;
}

// Converts raw text to markdown which highlights movie names
function convertToMarkdown(text: string) {
    text = <string>marked(text);
    text = text.replace(/<strong>(.*?)<\/strong>/g, '<strong style="color: cornflowerblue;">$1</strong>');
    return text;
}
