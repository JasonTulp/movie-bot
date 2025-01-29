# Use an official Node.js image as the base image
FROM node:18-slim

# Set the working directory in the container
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the rest of the application files
COPY . .

# Set environment variables during build or runtime
ARG VITE_RADARR_API_KEY
ARG VITE_RADARR_API_URL
ARG VITE_OLLAMA_API_URL
ARG VITE_PORT

# Expose the port based on the VITE_PORT environment variable, or default to 3000
EXPOSE ${VITE_PORT:-3030}

# Build the Vite app
RUN npm run build

# Start the Vite app
CMD ["npm", "run", "dev"]
