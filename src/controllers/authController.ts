import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import User from '../models/User.ts'; // Adjust the import path according to your project structure

dotenv.config(); // Load environment variables

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
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      res.status(400).json({ status: 0, message: 'Email already in use.' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ email, password: hashedPassword });

    const token = jwt.sign(
      { userId: newUser.id, email: newUser.email },
      process.env.JWT_SECRET as string,
      { expiresIn: '1h' }
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
    const user = await User.findOne({ where: { email } });
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
      { expiresIn: '1h' }
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
    const user = await User.findOne({ where: { email } });
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
    user.resetPasswordOTP = hashedOTP;
    user.resetPasswordExpires = new Date(Date.now() + OTP_EXPIRATION); // 10 minutes expiration
    await user.save();

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
    const user = await User.findOne({ where: { email } });
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
    user.password = hashedPassword;
    user.resetPasswordOTP = null; // Clear the OTP
    user.resetPasswordExpires = null; // Clear the expiration time
    await user.save();

    // Generate a JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: '1h' }
    );

    res.status(200).json({ status: 1, message: 'Password reset successfully.', token, user: { email: user.email } });
  } catch (err) {
    console.error(err);
   

    console.error(err);
    res.status(500).json({ status: 0, message: 'Error resetting password.' });
  }
};
