import { Request, Response } from 'express';

export const getVoiceList = async (req: Request, res: Response): Promise<void> => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
     res.status(401).json({ status: 0, message: 'No token provided.' });
  }

  try {
    const response = await fetch('https://api.elevenlabs.io/v1/voices');

    if (!response.ok) {
       res.status(response.status).json({ status: 0, message: 'Failed to fetch voices.' });
    }

    const voicesData = await response.json();

    // Return only the voices array directly
     res.status(200).json({ status: 1, voices: voicesData.voices });

  } catch (error) {
    console.error('Error fetching voices:', error);
     res.status(500).json({ status: 0, message: 'Internal server error.' });
  }
};
