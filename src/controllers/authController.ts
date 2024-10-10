import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import multer from 'multer'; // Import multer for file uploads
import { PrismaClient } from '@prisma/client'; // Import Prisma Client
import path from 'path';
import fs from 'fs';

dotenv.config(); // Load environment variables

const prisma = new PrismaClient(); // Initialize Prisma Client

const OTP_EXPIRATION = 10 * 60 * 1000; // OTP expires in 10 minutes

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
  host: process.env.MAILHOST as string,
  port: process.env.MAILPORT ? Number(process.env.MAILPORT) : 587,
  secure: true,
  auth: {
    user: process.env.MAILUSER as string,
    pass: process.env.MAILPASS as string,
  },
});

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.resolve('uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// Generate random 6-digit OTP
const generateOTP = (): string => Math.floor(100000 + Math.random() * 900000).toString();

// Signup controller
export const signup = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ status: 0, message: 'Email and password are required.' });
    return;
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ status: 0, message: 'Email already in use.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: { email, password: hashedPassword },
    });

    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      process.env.JWT_SECRET as string,
      { expiresIn: '180d' } // Set the token to expire in 180 days (approx. 6 months)
    );
    

    res.status(201).json({ status: 1, message: 'User created successfully', token, user: { email: newUser.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 0, message: 'Error creating user' });
  }
};

// Login controller
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ status: 0, message: 'Email and password are required.' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(400).json({ status: 0, message: 'Invalid email or password.' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(400).json({ status: 0, message: 'Invalid email or password.' });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: '180d' }
    );

    res.status(200).json({ status: 1, message: 'Login successful', token, user: { email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 0, message: 'Error logging in' });
  }
};

// Request password reset controller
export const requestPasswordReset = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({ status: 0, message: 'Email is required.' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(400).json({ status: 0, message: 'Email not found.' });
      return;
    }

    // Generate OTP
    const otp = generateOTP();
    console.log('Generated OTP:', otp); // Debugging purpose

    // Hash the OTP before storing it
    const hashedOTP = await bcrypt.hash(otp, 10);
    console.log('Hashed OTP:', hashedOTP); // Debugging purpose

    // Store the hashed OTP and expiration time in the user's database record
    await prisma.user.update({
      where: { email },
      data: {
        resetPasswordOTP: hashedOTP,
        resetPasswordExpires: new Date(Date.now() + OTP_EXPIRATION), // 10 minutes expiration
      },
    });

    // Send OTP via email
    await transporter.sendMail({
      from: process.env.MAILUSER as string,
      to: email,
      subject: 'Password Reset OTP',
      html: generateEmailTemplate(otp), // Use the email template
    });

    res.status(200).json({ status: 1, message: 'OTP sent to email.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 0, message: 'Error sending OTP.' });
  }
};

// Email template for OTP
const generateEmailTemplate = (otp: string): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset OTP</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f4f4f4;
          margin: 0;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: auto;
          background: #ffffff;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        h2 {
          color: #333;
        }
        .otp-box {
          border: 2px solid #007bff;
          border-radius: 5px;
          padding: 20px;
          text-align: center;
          font-size: 24px;
          color: #007bff;
          margin: 20px 0;
        }
        .footer {
          font-size: 12px;
          color: #999;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>Password Reset Request</h2>
        <p>Dear User,</p>
        <p>You requested a password reset. Please use the following OTP to reset your password:</p>
        <div class="otp-box">${otp}</div>
        <p>This OTP is valid for 10 minutes.</p>
        <p>If you did not request this, please ignore this email.</p>
        <div class="footer">
          <p>Thank you!</p>
          <p>Siteware</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

// Reset password controller
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const { email, otp, newPassword } = req.body;

  // Validate the required fields
  if (!email || !otp || !newPassword) {
    res.status(400).json({ status: 0, message: 'Email, OTP, and new password are required.' });
    return;
  }

  try {
    // Find user by email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(400).json({ status: 0, message: 'User not found.' });
      return;
    }

    // Check if OTP has expired
    if (!user.resetPasswordExpires || Date.now() > new Date(user.resetPasswordExpires).getTime()) {
      res.status(400).json({ status: 0, message: 'OTP has expired.' });
      return;
    }

    // Ensure the OTP exists
    if (!user.resetPasswordOTP) {
      res.status(400).json({ status: 0, message: 'No OTP set for this user.' });
      return;
    }

    // Compare the hashed OTP with the submitted OTP
    const isOTPValid = await bcrypt.compare(otp, user.resetPasswordOTP);
    if (!isOTPValid) {
      res.status(400).json({ status: 0, message: 'Invalid OTP.' });
      return;
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password and clear the OTP fields
    await prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        resetPasswordOTP: null, // Clear the OTP
        resetPasswordExpires: null, // Clear the expiration time
      },
    });

    // Generate a JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: '180d' }
    );

    res.status(200).json({ status: 1, message: 'Password reset successfully.', token, user: { email:user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 0, message: 'Error resetting password.' });
  }
};

// Update profile avatar controller
export const updateProfileAvatar = async (req: Request, res: Response): Promise<void> => {
  upload.single('avatar')(req, res, async (err) => {
    if (err) {
      res.status(400).json({ status: 0, message: 'Error uploading avatar.' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ status: 0, message: 'No file uploaded.' });
      return;
    }

    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      res.status(401).json({ status: 0, message: 'Unauthorized.' });
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: number };
      const userId = decoded.userId;

      // Find user by userId
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        res.status(400).json({ status: 0, message: 'User not found.' });
        return;
      }

      // Update the user's avatar URL
      const avatarUrl = `/uploads/${req.file.filename}`;
      await prisma.user.update({
        where: { id: userId },
        data: { avatarUrl },
      });

      res.status(200).json({ status: 1, message: 'Profile avatar updated successfully.', avatarUrl });
    } catch (err) {
      console.error(err);
      res.status(500).json({ status: 0, message: 'Error updating profile avatar.' });
    }
  });
};

// Remove profile avatar controller
export const removeProfileAvatar = async (req: Request, res: Response): Promise<void> => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    res.status(401).json({ status: 0, message: 'Unauthorized.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: number };
    const userId = decoded.userId;

    // Find user by userId
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(400).json({ status: 0, message: 'User not found.' });
      return;
    }

    // Remove the avatar file if it exists
    if (user.avatarUrl) {
      const filePath = path.resolve(`.${user.avatarUrl}`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Update the user's avatar URL to an empty string
    await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: '' },
    });

    res.status(200).json({ status: 1, message: 'Profile avatar removed successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 0, message: 'Error removing profile avatar.' });
  }
};

// Get profile information controller
export const getProfileInformation = async (req: Request, res: Response): Promise<void> => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    res.status(401).json({ status: 0, message: 'Unauthorized.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: number };
    const userId = decoded.userId;

    // Find user by userId
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(400).json({ status: 0, message: 'User not found.' });
      return;
    }

    // Send profile information
    const { firstName, lastName, username, avatarUrl, email } = user;
    res.status(200).json({
      status: 1,
      user: {
        firstName,
        lastName,
        username,
        avatarUrl,
        email,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 0, message: 'Error retrieving profile information.' });
  }
};


// Update profile information controller
export const updateProfileInformation = async (req: Request, res: Response): Promise<void> => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    res.status(401).json({ status: 0, message: 'Unauthorized.' });
    return;
  }

  const { firstName, lastName, username, email } = req.body;

  if (!firstName && !lastName && !username && !email) {
    res.status(400).json({ status: 0, message: 'At least one field is required to update.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: number };
    const userId = decoded.userId;

    // Check if username already exists
    if (username) {
      const existingUser = await prisma.user.findUnique({ where: { username } });
      if (existingUser && existingUser.id !== userId) {
        res.status(400).json({ status: 0, message: 'Username already in use.' });
        return;
      }
    }

    // Check if email already exists
    if (email) {
      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser && existingUser.id !== userId) {
        res.status(400).json({ status: 0, message: 'Email already in use.' });
        return;
      }
    }

    // Update user information
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        username,
        email,
      },
    });

    res.status(200).json({
      status: 1,
      message: 'Profile information updated successfully.',
      user: {
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        username: updatedUser.username,
        email: updatedUser.email,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 0, message: 'Error updating profile information.' });
  }
};

// Remove account controller
export const removeAccount = async (req: Request, res: Response): Promise<void> => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    res.status(401).json({ status: 0, message: 'Unauthorized.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: number };
    const userId = decoded.userId;

    // Delete related records before deleting the user account
    await prisma.agent.deleteMany({ where: { userId } });
    // Add more related records deletion if necessary here

    // Delete user account
    await prisma.user.delete({ where: { id: userId } });

    res.status(200).json({ status: 1, message: 'Account removed successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 0, message: 'Error removing account.' });
  }
};

// Update password
export const updatePassword = async (req: Request, res: Response): Promise<void> => {
  const { oldPassword, newPassword, confirmPassword } = req.body;

  // Get token from the Authorization header
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) {
    res.status(401).json({ status: 0, message: 'No token provided.' });
    return;
  }

  try {
    // Verify the token and extract userId
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key') as { userId: number };
    const userId = decoded.userId; // Extract userId from the decoded token

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(404).json({ status: 0, message: 'User not found' });
      return;
    }

    // Check if old password matches
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      res.status(400).json({ status: 0, message: 'Old password is incorrect.' });
      return;
    }

    // Check if new password and confirm password match
    if (newPassword !== confirmPassword) {
      res.status(400).json({ status: 0, message: 'New password and confirm password do not match.' });
      return;
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.status(200).json({ status: 1, message: 'Password updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 0, message: 'Failed to update password' });
  }
};