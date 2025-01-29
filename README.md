### Overview
This project is a simple front-end that allows you to interact with a Radarr instance using a custom model created with Ollama.
It allows you to ask the model for movie recommendations, then request that any recommendations get downloaded.
If the model sends any download requests, this app will intercept it and send that request to Radarr for processing.

### Creating the custom model with Ollama.
In the bot.modelfile file there are some system commands that tell the LLM how to behave. 
The important part is how it handles the request to download movies. We need these names
in a specific format to be able to extract them and send them to Radarr

```bash
# Ensure llama3.1 is downloaded
ollama pull llama3.1:8b
# Create our custom movie bot
ollama create -f ./bot.modelfile movie-bot
# Test that it works
ollama run movie-bot
```

### Setting up Env Variables
I assume that you have a radarr service running already, so won't go into details on how to set that up
In your .env file you need to set the following variables:
```bash
VITE_RADARR_API_KEY='SOME_API_KEY' # This is the API key for Radarr
VITE_PORT=3030 # This is the port that the front-end will be hosted on
VITE_RADARR_API_URL='http://localhost:7878/api/v3' # This is the default port for Radarr
VITE_OLLAMA_API_URL='http://localhost:11434' # This is the default port for the Ollama API
VITE_DOMAIN='example.com' # This is the domain that the front-end will be hosted on
VITE_OLLAMA_MODEL_NAME='movie-bot' # This is the name of the model that we created with Ollama
```

### Running the front-end
The front-end can either be run locally with the following:
```bash
npm run dev
```
Or found on docker under the image tag: `jasontulp/movie-bot:latest`
```bash
docker pull jasontulp/movie-bot:latest
docker run -p 3000:3000 \                         
  -e VITE_RADARR_API_KEY=API_KEY \
  -e VITE_RADARR_API_URL=http://localhost:7878/api/v3\
  -e VITE_OLLAMA_API_URL=http://localhost:11434 \
  movie-bot
```
