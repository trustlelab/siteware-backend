import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Upload file
export const uploadFile = async (req: Request, res: Response): Promise<void> => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    res.status(401).json({ status: 0, message: 'No token provided.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key') as { userId: number };
    const userId = decoded.userId;

    if (!req.file) {
      res.status(400).json({ status: 0, message: 'No file uploaded.' });
      return;
    }

    const { filename: fileName } = req.file;
    const url = `/uploads/files/${fileName}`; // Use forward slashes and include the leading slash

    const uuid = Math.random().toString(36).substring(2, 15);

    const newFile = await prisma.file.create({
      data: {
        fileName,
        label: req.body.label || null,
        uuid,
        url,
        userId,
      },
    });

    res.status(201).json({ status: 1, message: 'File uploaded successfully', file: newFile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 0, message: 'Failed to upload file' });
  }
};

// List files by user
export const listUserFiles = async (req: Request, res: Response): Promise<void> => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    res.status(401).json({ status: 0, message: 'No token provided.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key') as { userId: number };
    const userId = decoded.userId;

    const files = await prisma.file.findMany({
      where: { userId },
    });

    res.status(200).json({ status: 1, message: 'Files fetched successfully', files });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 0, message: 'Failed to fetch files' });
  }
};

export const deleteUserFile = async (req: Request, res: Response): Promise<void> => {
  const fileId = parseInt(req.params.id, 10);
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    res.status(401).json({ status: 0, message: 'No token provided.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key') as { userId: number };
    const userId = decoded.userId;

    const file = await prisma.file.findFirst({
      where: { id: fileId, userId },
    });

    if (!file) {
      res.status(404).json({ status: 0, message: 'File not found or unauthorized' });
      return;
    }

    // Convert URL to file system path
    const filePath = path.join(__dirname, '../../', file.url); // Adjust based on your project structure

    // Try to delete the file from storage
    fs.unlink(filePath, async (err) => {
      if (err) {
        console.error('Failed to delete file from storage:', err);

        // Proceed to delete the record from the database even if the file deletion fails
        await prisma.file.delete({
          where: { id: fileId },
        });

        // Respond indicating the storage deletion failure but database success
        res.status(200).json({
          status: 1,
          message: 'File record deleted from the database, but failed to delete file from storage.',
          file,
        });
      } else {
        // If file deletion from storage is successful, delete the file record from the database
        await prisma.file.delete({
          where: { id: fileId },
        });

        res.status(200).json({
          status: 1,
          message: 'File deleted successfully from both storage and database.',
          file,
        });
      }
    });
  } catch (err) {
    res.status(500).json({ status: 0, message: 'Failed to delete file' });
  }
};
