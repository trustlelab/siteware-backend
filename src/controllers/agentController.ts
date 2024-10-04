// src/controllers/agentController.ts

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client'; // Import Prisma Client
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables

const prisma = new PrismaClient(); // Initialize Prisma Client

// Create a new agent
export const createAgent = async (req: Request, res: Response): Promise<void> => {
  const { name, model, speechRecognition, languageSupport, ttsEngine, ttsVoices, sttEngine, realTimeSTT, voiceCallSupported, voiceCallProvider } = req.body;

  // Validate required fields
  if (!name) {
    res.status(400).json({ status: 0, message: 'Name is required.' });
    return;
  }

  try {
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
      },
    });

    res.status(201).json({ status: 1, message: 'Agent created successfully', agent: newAgent });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 0, message: 'Error creating agent' });
  }
};

// Get list of all agents
export const getAllAgents = async (req: Request, res: Response): Promise<void> => {
  try {
    const agents = await prisma.agent.findMany();
    res.status(200).json({ status: 1, message: 'Agents fetched successfully', agents });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 0, message: 'Failed to fetch agents' });
  }
};

// Get agent by ID
export const getAgentById = async (req: Request, res: Response): Promise<void> => {
  const agentId = parseInt(req.params.id); // Convert to integer

  try {
    const agent = await prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent) {
      res.status(404).json({ status: 0, message: 'Agent not found' });
      return;
    }

    res.status(200).json({ status: 1, message: 'Agent fetched successfully', agent });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 0, message: 'Failed to fetch agent' });
  }
};

// Update an existing agent
export const updateAgent = async (req: Request, res: Response): Promise<void> => {
  const agentId = parseInt(req.params.id); // Convert to integer
  const updates = req.body;

  try {
    const agent = await prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent) {
      res.status(404).json({ status: 0, message: 'Agent not found' });
      return;
    }

    const updatedAgent = await prisma.agent.update({
      where: { id: agentId },
      data: updates,
    });

    res.status(200).json({ status: 1, message: 'Agent updated successfully', agent: updatedAgent });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 0, message: 'Failed to update agent' });
  }
};

// Remove an agent
export const removeAgent = async (req: Request, res: Response): Promise<void> => {
  const agentId = parseInt(req.params.id); // Convert to integer

  try {
    const agent = await prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent) {
      res.status(404).json({ status: 0, message: 'Agent not found' });
      return;
    }

    await prisma.agent.delete({ where: { id: agentId } });
    res.status(200).json({ status: 1, message: 'Agent removed successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 0, message: 'Failed to remove agent' });
  }
};
