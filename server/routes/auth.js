import { ObjectId } from "mongodb";
import { getDatabase } from "../db.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Email configuration
const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'arvilightss@gmail.com',
    pass: 'ercr apbp bjap tpvs'
  }
});

/**
 * Send OTP email function
 * @param {string} email - Recipient email
 * @param {string} otp - OTP code
 * @param {string} userName - User name
 */
const sendOTPEmail = async (email, otp, userName) => {
  const mailOptions = {
    from: {
      name: 'AI Lab Booking System',
      address: 'arvilightss@gmail.com'
    },
    to: email,
    subject: 'Password Reset OTP - AI Lab Booking System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
          <h1 style="color: white; margin: 0; font-size: 28px;">AI Lab Booking System</h1>
          <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Password Reset Request</p>
        </div>

        <div style="background: #f8f9fa; padding: 30px; border-radius: 10px; border-left: 4px solid #667eea;">
          <h2 style="color: #333; margin-top: 0;">Hello ${userName},</h2>
          <p style="color: #666; line-height: 1.6; font-size: 16px;">
            You have requested to reset your password for the AI Lab Booking System.
            Please use the following One-Time Password (OTP) to verify your identity:
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <div style="background: #667eea; color: white; font-size: 32px; font-weight: bold; padding: 15px 30px; border-radius: 8px; display: inline-block; letter-spacing: 8px;">
              ${otp}
            </div>
          </div>

          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #856404; font-size: 14px;">
              <strong>Important:</strong> This OTP will expire in 10 minutes for security reasons.
            </p>
          </div>

          <p style="color: #666; line-height: 1.6;">
            If you did not request this password reset, please ignore this email.
            Your account security is important to us.
          </p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

          <p style="color: #999; font-size: 12px; text-align: center;">
            This is an automated message from AI Department Lab Booking System.
            Please do not reply to this email.
          </p>
        </div>
      </div>
    `
  };

  await emailTransporter.sendMail(mailOptions);
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const db = await getDatabase();
    const user = await db.collection('users').findOne({ email });
    
    if (!user || !user.password) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }
    
    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    
    // Remove password from user object
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({ 
      success: true, 
      user: userWithoutPassword, 
      token 
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const register = async (req, res) => {
  try {
    const { email, password, name, role, ccId } = req.body;
    
    const db = await getDatabase();
    
    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already exists' 
      });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = {
      email,
      password: hashedPassword,
      name,
      role,
      ...(ccId && { ccId }),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('users').insertOne(newUser);
    
    const { password: _, ...userWithoutPassword } = newUser;
    
    res.status(201).json({ 
      success: true, 
      user: { ...userWithoutPassword, _id: result.insertedId } 
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error' 
    });
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const verifyToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided' 
      });
    }
    
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const db = await getDatabase();
    const user = await db.collection('users').findOne({ _id: new ObjectId(decoded.userId) });
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    const { password: _, ...userWithoutPassword } = user;
    
    res.json({ 
      success: true, 
      user: userWithoutPassword 
    });
    
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// In-memory store for OTPs (in production, use Redis or database)
const otpStore = {};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const db = await getDatabase();
    const user = await db.collection('users').findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email address'
      });
    }

    // Generate 6-digit OTP
    const otp = crypto.randomBytes(3).toString('hex').substring(0, 6).toUpperCase();

    // Store OTP with 10-minute expiry
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 10);

    otpStore[email] = {
      otp,
      expires,
      verified: false
    };

    // Send OTP via email
    try {
      await sendOTPEmail(email, otp, user.name);
      console.log(`✅ OTP email sent successfully to ${email}`);
    } catch (emailError) {
      console.error('Failed to send OTP email:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send OTP email. Please try again.'
      });
    }

    res.json({
      success: true,
      message: 'OTP has been sent to your email address. Please check your inbox and spam folder.'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }

    const storedOTP = otpStore[email];

    if (!storedOTP) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found for this email. Please request a new one.'
      });
    }

    if (new Date() > storedOTP.expires) {
      delete otpStore[email];
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.'
      });
    }

    if (storedOTP.otp !== otp.toUpperCase()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please try again.'
      });
    }

    // Mark OTP as verified
    otpStore[email].verified = true;

    res.json({
      success: true,
      message: 'OTP verified successfully. You can now reset your password.'
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP, and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    const storedOTP = otpStore[email];

    if (!storedOTP || !storedOTP.verified) {
      return res.status(400).json({
        success: false,
        message: 'OTP not verified. Please verify OTP first.'
      });
    }

    if (new Date() > storedOTP.expires) {
      delete otpStore[email];
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please start the process again.'
      });
    }

    if (storedOTP.otp !== otp.toUpperCase()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP.'
      });
    }

    const db = await getDatabase();
    const user = await db.collection('users').findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    await db.collection('users').updateOne(
      { email },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date()
        }
      }
    );

    // Clean up OTP store
    delete otpStore[email];

    res.json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};
