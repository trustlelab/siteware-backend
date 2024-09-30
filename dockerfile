# Use an official Node.js runtime as the base image
FROM node:18

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Expose the port the app runs on (replace with your app's port if different)
EXPOSE 3000

# Set environment variables if needed (you can also set this via Docker Compose or Kubernetes)
# ENV DEEPGRAM_API_KEY=<your_deepgram_api_key>
# ENV OPENAI_API_KEY=<your_openai_api_key>

# Start the application in development mode
CMD ["npm", "run", "dev"]
