const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');
require('dotenv').config(); // Load environment variables

const OTP_EXPIRATION = 10 * 60 * 1000;  // OTP expires in 10 minutes

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
  host: process.env.MAILHOST,
  port: process.env.MAILPORT,
  secure: true,
  auth: {
    user: process.env.MAILUSER,
    pass: process.env.MAILPASS,
  },
});

// Generate random 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Signup controller
const signup = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ status: 0, message: 'Email and password are required.' });
  }

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ status: 0, message: 'Email already in use.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ email, password: hashedPassword });

    const token = jwt.sign({ userId: newUser.id, email: newUser.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(201).json({ status: 1, message: 'User created successfully', token, user: { email: newUser.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 0, message: 'Error creating user' });
  }
};

// Login controller
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ status: 0, message: 'Email and password are required.' });
  }

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ status: 0, message: 'Invalid email or password.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ status: 0, message: 'Invalid email or password.' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ status: 1, message: 'Login successful', token, user: { email: user.email } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 0, message: 'Error logging in' });
  }
};

// Request Password Reset (OTP)
const requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ status: 0, message: 'Email is required.' });
  }

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ status: 0, message: 'Email not found.' });
    }

    // Generate OTP
    const otp = generateOTP();
    console.log('Generated OTP:', otp); // Debugging purpose

    // Hash the OTP before storing it
    const hashedOTP = await bcrypt.hash(otp, 10);
    console.log('Hashed OTP:', hashedOTP); // Debugging purpose

    // Store the hashed OTP and expiration time in the user's database record
    user.resetPasswordOTP = hashedOTP;
    user.resetPasswordExpires = Date.now() + OTP_EXPIRATION; // 10 minutes expiration
    await user.save();

    // Send OTP via email
    await transporter.sendMail({
      from: process.env.MAILUSER,
      to: email,
      subject: 'Siteware Password Reset OTP ',
      html: generateEmailTemplate(otp), // Use the email template
    });

    return res.status(200).json({ status: 1, message: 'OTP sent to email.' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 0, message: 'Error sending OTP.' });
  }
};
// Function to generate the HTML email template
const generateEmailTemplate = (otp) => {
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

// Reset Password using OTP
const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  // Validate the required fields
  if (!email || !otp || !newPassword) {
    return res.status(400).json({ status: 0, message: 'Email, OTP, and new password are required.' });
  }

  try {
    // Find user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ status: 0, message: 'User not found.' });
    }

    // Check if OTP has expired
    if (Date.now() > user.resetPasswordExpires) {
      return res.status(400).json({ status: 0, message: 'OTP has expired.' });
    }

    // Log for debugging purposes
    console.log('User input OTP:', otp);  // Log the OTP the user provided
    console.log('Stored hashed OTP:', user.resetPasswordOTP);  // Log the OTP stored in the database

    // Ensure that the OTP and stored hashed OTP exist
    if (!otp || !user.resetPasswordOTP) {
      return res.status(400).json({ status: 0, message: 'Invalid OTP or no OTP set for this user.' });
    }

    // Compare the hashed OTP with the submitted OTP
    const isOTPValid = await bcrypt.compare(otp, user.resetPasswordOTP);
    if (!isOTPValid) {
      return res.status(400).json({ status: 0, message: 'Invalid OTP.' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    user.password = hashedPassword;
    user.resetPasswordOTP = null; // Clear the OTP
    user.resetPasswordExpires = null; // Clear the expiration time
    await user.save();

    // Generate a JWT token
    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    return res.status(200).json({ status: 1, message: 'Password reset successfully.', token, user: { email: user.email } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 0, message: 'Error resetting password.' });
  }
};

module.exports = { signup, login, requestPasswordReset, resetPassword };
