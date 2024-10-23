import twilio from 'twilio';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';

const prisma = new PrismaClient();


export const addTwilioNumber = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phoneNumber, label, accountSid, authToken } = req.body;
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      res.status(401).json({ message: 'Authorization token is required.' });
      return;
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined.');
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as jwt.JwtPayload;
    const userId = decoded.userId;

    if (!phoneNumber || !accountSid || !authToken) {
      res.status(400).json({ message: 'Phone number, account SID, and auth token are required.' });
      return;
    }

    // Check if the phone number already exists for the user
    const existingNumber = await prisma.twilioNumber.findFirst({
      where: {
        phoneNumber,
        userId,
      },
    });

    if (existingNumber) {
      res.status(400).json({ message: 'The phone number is already added.' });
      return;
    }

    const client = twilio(accountSid, authToken);

    // Validate the Twilio credentials by checking if the number is already purchased
    const number = await client.incomingPhoneNumbers
      .list({ phoneNumber })
      .then((numbers) => (numbers.length > 0 ? numbers[0] : null));

    if (!number) {
      res.status(400).json({ message: 'The provided phone number is not purchased or invalid.' });
      return;
    }

    // Save the Twilio credentials to the database using Prisma
    await prisma.twilioNumber.create({
      data: {
        userId,
        phoneNumber,
        label,
        accountSid,
        authToken,
      },
    });

    // Now set the webhook URL for the phone number using the provided SID and token
    const webhookUrl = `${process.env.WEBHOOK_BASE_URL}/twiml`; // Make sure WEBHOOK_BASE_URL is set in the environment
    await client.incomingPhoneNumbers(number.sid).update({
      smsUrl: webhookUrl,
      voiceUrl: webhookUrl,
    });

    res.status(201).json({ message: 'Twilio number added successfully and webhook updated.', phoneNumber });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ message: 'Failed to add Twilio number and update webhook.', error: errorMessage });
  }
};


export const removeTwilioNumber = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      res.status(401).json({ message: 'Authorization token is required.' });
      return;
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined.');
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as jwt.JwtPayload;
    const userId = decoded.userId;

    if (!id) {
      res.status(400).json({ message: 'Twilio number ID is required.' });
      return;
    }

    // Remove the Twilio number from the database using Prisma
    const deletedNumber = await prisma.twilioNumber.deleteMany({
      where: {
        id: parseInt(id, 10),
        userId,
      },
    });

    if (deletedNumber.count === 0) {
      res.status(404).json({ message: 'Twilio number not found or not authorized to delete.' });
      return;
    }

    res.status(200).json({ message: 'Twilio number removed successfully.', id });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ message: 'Failed to remove Twilio number.', error: errorMessage });
  }
};

export const listTwilioNumbers = async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      res.status(401).json({ message: 'Authorization token is required.' });
      return;
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined.');
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as jwt.JwtPayload;
    const userId = decoded.userId;

    // Retrieve the list of Twilio numbers from the database using Prisma
    const twilioNumbers = await prisma.twilioNumber.findMany({
      where: { userId },
    });

    res.status(200).json(twilioNumbers);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ message: 'Failed to retrieve Twilio numbers.', error: errorMessage });
  }
};

export const setupTwilioWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phoneNumber, webhookUrl } = req.body;
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      res.status(401).json({ message: 'Authorization token is required.' });
      return;
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined.');
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as jwt.JwtPayload;
    const userId = decoded.userId;

    if (!phoneNumber || !webhookUrl) {
      res.status(400).json({ message: 'Phone number and webhook URL are required.' });
      return;
    }

    // Retrieve Twilio credentials from the database
    const twilioNumber = await prisma.twilioNumber.findFirst({
      where: {
        phoneNumber,
        userId,
      },
    });

    if (!twilioNumber) {
      res.status(404).json({ message: 'Twilio number not found.' });
      return;
    }

    const client = twilio(twilioNumber.accountSid, twilioNumber.authToken);
    const incomingPhoneNumber = await client.incomingPhoneNumbers
      .list({ phoneNumber })
      .then((numbers) => (numbers.length > 0 ? numbers[0] : null));

    if (!incomingPhoneNumber) {
      res.status(404).json({ message: 'Twilio number not found.' });
      return;
    }

    await client.incomingPhoneNumbers(incomingPhoneNumber.sid).update({ voiceUrl: webhookUrl });
    res.status(200).json({ message: 'Webhook set up successfully.', phoneNumber, webhookUrl });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ message: 'Failed to set up webhook.', error: errorMessage });
  }
};

export const validateTwilioNumber = async (req: Request, res: Response): Promise<void> => {
  try {
    const { phoneNumber } = req.body;
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      res.status(401).json({ message: 'Authorization token is required.' });
      return;
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined.');
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as jwt.JwtPayload;
    const userId = decoded.userId;

    if (!phoneNumber) {
      res.status(400).json({ message: 'Phone number is required.' });
      return;
    }

    // Retrieve Twilio credentials from the database
    const twilioNumber = await prisma.twilioNumber.findFirst({
      where: {
        phoneNumber,
        userId,
      },
    });

    if (!twilioNumber) {
      res.status(400).json({ message: 'Twilio number is not valid.' });
      return;
    }

    const client = twilio(twilioNumber.accountSid, twilioNumber.authToken);
    const number = await client.incomingPhoneNumbers
      .list({ phoneNumber })
      .then((numbers) => (numbers.length > 0 ? numbers[0] : null));

    if (!number) {
      res.status(400).json({ message: 'Twilio number is not valid.' });
      return;
    }
    res.status(200).json({ message: 'Twilio number is valid.', phoneNumber });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ message: 'Failed to validate Twilio number.', error: errorMessage });
  }
};

export const updateTwilioNumberLabel = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { label } = req.body;
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      res.status(401).json({ message: 'Authorization token is required.' });
      return;
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET is not defined.');
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as jwt.JwtPayload;
    const userId = decoded.userId;

    if (!id || !label) {
      res.status(400).json({ message: 'Twilio number ID and label are required.' });
      return;
    }

    // Update the Twilio number label in the database using Prisma
    const updatedNumber = await prisma.twilioNumber.updateMany({
      where: {
        id: parseInt(id, 10),
        userId,
      },
      data: {
        label,
      },
    });

    if (updatedNumber.count === 0) {
      res.status(404).json({ message: 'Twilio number not found or not authorized to update.' });
      return;
    }

    res.status(200).json({ message: 'Twilio number label updated successfully.', id, label });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    res.status(500).json({ message: 'Failed to update Twilio number label.', error: errorMessage });
  }
};