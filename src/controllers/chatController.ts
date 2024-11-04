// src/controllers/chatController.ts

import { Request, Response } from 'express';
import { QuestionAnswerAgent } from '../services/chatService';
import { logger } from '../helpers/logger';

const questionAnswerAgent = new QuestionAnswerAgent(); 

// Define the function to handle incoming messages with streaming response
export const handleIncomingMessage = async (req: Request, res: Response): Promise<void> => {
  // Extract and parse the JSON body
  const { query } = req.body as { query: string }; // Access the "query" field in the JSON body


  // Get embedding by openai Service
  const response = await questionAnswerAgent.get_answer(query);
  

  // Set headers for a streaming response
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Transfer-Encoding', 'chunked');
  res.status(200);

  // Begin streaming response
  res.write('Processing your request...\n');
  
  // Simulate a delay for streaming effect
  setTimeout(() => {
    res.write(`Response: ${response}\n`);
    
    // End the response after sending all chunks
    res.end();
  }, 1000); // Adjust delay as needed
};

// 