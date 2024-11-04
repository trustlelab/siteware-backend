// src/controllers/agentController.ts

import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client"; // Import Prisma Client
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import pdfParse from "pdf-parse";
import path from "path";
import fs from "fs";

dotenv.config(); // Load environment variables

const prisma = new PrismaClient(); // Initialize Prisma Client

// Function to generate a unique ID
const generateUniqueId = (): string => {
  return Math.random().toString(36).substring(2, 12); // Generates a random 10-character string
};


const UPLOADS_DIR = path.join(__dirname, "../../");

export const processKnowledgebaseFiles = async (req: Request, res: Response): Promise<void> => {
  const { agentId, uuids } = req.body;

  // Validate required fields
  if (!agentId || !Array.isArray(uuids) || uuids.length === 0) {
    res.status(400).json({ status: 0, message: "agentId and a non-empty array of file uuids are required." });
    return;
  }

  try {
    const extractedTexts = [];

    for (const uuid of uuids) {
      // Fetch file based on uuid
      const file = await prisma.file.findUnique({
        where: { uuid },
      });

      // Skip if file not found
      if (!file) {
        console.warn(`File with uuid ${uuid} not found. Skipping.`);
        continue;
      }

      // Construct the file path
      const filePath = path.join(UPLOADS_DIR, file.url);

      // Log the file path to verify correctness
      console.log(`Attempting to read file at path: ${filePath}`);

      // Check if file exists before attempting to read
      if (!fs.existsSync(filePath)) {
        console.warn(`File at path ${filePath} does not exist. Skipping.`);
        continue;
      }

      try {
        // Read the file content and process it
        const dataBuffer = fs.readFileSync(filePath);
        const pdfData = await pdfParse(dataBuffer);

        console.log(`Extracted Text for ${uuid}:`, pdfData.text);
        extractedTexts.push({ uuid, text: pdfData.text });
      } catch (fileReadError) {
        console.error(`Error reading or parsing file with uuid ${uuid}:`, fileReadError);
      }
    }

    res.status(200).json({
      status: 1,
      message: "Files processed successfully",
      extractedTexts,
    });
  } catch (err) {
    console.error("Error processing files:", err);
    res.status(500).json({ status: 0, message: "Failed to process files" });
  }
};

// Create a new agent
export const createAgent = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const {
    name,
    model,
    speechRecognition,
    languageSupport,
    ttsEngine,
    ttsVoices,
    sttEngine,
    realTimeSTT,
    voiceCallSupported,
    voiceCallProvider,
    agentType, // Extract agentType from request body
  } = req.body;

  // Validate required fields
  if (!name) {
    res.status(400).json({ status: 0, message: "Name is required." });
    return;
  }
  if (!agentType || (agentType !== "TEXT" && agentType !== "VOICE")) {
    res.status(400).json({
      status: 0,
      message: 'Agent type is required and must be either "TEXT" or "VOICE".',
    });
    return;
  }

  // Get token from the Authorization header
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    res.status(401).json({ status: 0, message: "No token provided." });
    return;
  }

  try {
    // Verify the token and extract userId
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your_secret_key",
    ) as { userId: number };
    const userId = decoded.userId; // Extract userId from the decoded token

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      res.status(404).json({ status: 0, message: "User not found." });
      return;
    }

    const uniqueId = generateUniqueId(); // Generate unique ID for the agent

    const newAgent = await prisma.agent.create({
      data: {
        name,
        model,
        speechRecognition,
        languageSupport,
        ttsEngine,
        ttsVoices,
        sttEngine,
        realTimeSTT,
        voiceCallSupported,
        voiceCallProvider,
        agentType, // Include agentType in the agent data
        userId, // Include userId in the agent data
        uniqueId, // Include uniqueId in the agent data
      },
    });

    res.status(201).json({
      status: 1,
      message: "Agent created successfully",
      agent: newAgent,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 0, message: "Error creating agent" });
  }
};

// Get list of all agents
export const getAllAgents = async (
  req: Request,
  res: Response,
): Promise<void> => {
  // Get token from the Authorization header
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    res.status(401).json({ status: 0, message: "No token provided." });
    return;
  }

  try {
    // Verify the token and extract userId
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your_secret_key",
    ) as { userId: number };
    const userId = decoded.userId; // Extract userId from the decoded token

    const agents = await prisma.agent.findMany({
      where: {
        userId, // Fetch only agents belonging to the authenticated user
      },
    });
    res.status(200).json({
      status: 1,
      message: "Agents fetched successfully",
      agents,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 0, message: "Failed to fetch agents" });
  }
};

export const getAgentById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({ status: 0, message: "Invalid agent ID." });
    return;
  }

  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    res.status(401).json({ status: 0, message: "No token provided." });
    return;
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your_secret_key",
    ) as { userId: number };
    const userId = decoded.userId;

    const agent = await prisma.agent.findFirst({
      where: { id, userId },
    });
    if (!agent) {
      res.status(404).json({
        status: 0,
        message: "Agent not found or unauthorized",
      });
      return;
    }
    res.status(200).json({
      status: 1,
      message: "Agent fetched successfully",
      agent,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 0, message: "Failed to fetch agent" });
  }
};

// Update an existing agent by id
export const updateAgent = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const id: number = parseInt(req.params.id, 10);
  const updates: Partial<Record<string, any>> = req.body;

  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    res.status(401).json({ status: 0, message: "No token provided." });
    return;
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your_secret_key",
    ) as { userId: number };
    const userId: number = decoded.userId;

    const agent = await prisma.agent.findFirst({
      where: { id, userId },
    });
    if (!agent) {
      res.status(404).json({
        status: 0,
        message: "Agent not found or unauthorized",
      });
      return;
    }

    const updatedAgent = await prisma.agent.update({
      where: { id: agent.id },
      data: {
        ...updates,
      },
    });

    res.status(200).json({
      status: 1,
      message: "Agent updated successfully",
      agent: updatedAgent,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 0, message: "Failed to update agent" });
  }
};
// Remove an agent
export const removeAgent = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const agentId = parseInt(req.params.id); // Convert to integer

  // Get token from the Authorization header
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    res.status(401).json({ status: 0, message: "No token provided." });
    return;
  }

  try {
    // Verify the token and extract userId
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your_secret_key",
    ) as { userId: number };
    const userId = decoded.userId; // Extract userId from the decoded token

    const agent = await prisma.agent.findUnique({
      where: { id: agentId, userId }, // Ensure the agent belongs to the authenticated user
    });
    if (!agent) {
      res.status(404).json({ status: 0, message: "Agent not found" });
      return;
    }

    await prisma.agent.delete({ where: { id: agentId } });
    res.status(200).json({ status: 1, message: "Agent removed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 0, message: "Failed to remove agent" });
  }
};

