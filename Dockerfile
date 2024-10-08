# Use the official Node.js v22.0.0 image as the base
FROM node:22.0.0

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to install dependencies
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Run Prisma generate to initialize Prisma Client
RUN npx prisma generate

# Build the TypeScript code to JavaScript
RUN npm run build

# Expose the port that your Node.js app will run on
EXPOSE 8000

# Define environment variables (if any)
ENV NODE_ENV=production

# Start the app using the compiled JavaScript file
CMD ["npm", "run", "start"]
