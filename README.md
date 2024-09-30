Siteware Backend: Callable Deepgram <> Twilio Streaming Voice Agent
===================================================================

This project provides a streaming voice agent with the following features:

*   Callable Phone Number
*   Twilio Inbound & Outbound Audio Streaming
*   Deepgram Speech-to-Text
*   OpenAI Language Model
*   Deepgram Text-to-Speech

Setup Instructions
------------------

### 1\. Clone the Repository

    git clone <repo_url>
    cd siteware-backend
    

### 2\. Install Dependencies

    npm i
    # Or
    yarn i
    

### 3\. Set Environment Variables

Update the following variables in your `.env` file:

    TWILIO_ACCOUNT_SID=your_account_sid
    TWILIO_AUTH_TOKEN=your_auth_token
    TWILIO_PHONE_NUMBER=+12088048913
    DEEPGRAM_API_KEY=your_deepgram_api_key
    OPENAI_API_KEY=your_openai_api_key
    

### 4\. Run the Server

    npm run dev
    # Or
    yarn dev
    

Docker Setup
------------

To run the application using Docker, follow these steps:


    

### 1\. Build the Docker Image

    docker build -t siteware-ai-voice-agent .

### 2\. Run the Docker Container

    docker run -p 3000:3000 siteware-ai-voice-agent
    

The ngrok setup will be handled automatically in the background. No manual configuration is needed.

That’s all! The server will handle everything automatically, including the ngrok setup.