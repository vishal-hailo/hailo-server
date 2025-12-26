import express from 'express';
import { generateToken, verifyAuth } from '../middleware/auth.js';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const MOCK_OTP = process.env.OTP_MOCK_CODE || '1234';

// POST /api/v1/auth/request-otp
router.post('/request-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone || !phone.startsWith('+91')) {
      return res.status(400).json({ error: 'Invalid phone number. Must start with +91' });
    }
    
    // In mock mode, always succeed
    res.json({ 
      success: true, 
      message: 'OTP sent successfully',
      mockOtp: MOCK_OTP,
      note: 'In production, OTP would be sent via SMS'
    });
  } catch (error) {
    console.error('Request OTP error:', error);
    res.status(500).json({ error: 'Failed to send OTP' });
  }
});

// POST /api/v1/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp, name } = req.body;
    
    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone and OTP are required' });
    }
    
    // Verify mock OTP
    if (otp !== MOCK_OTP) {
      return res.status(401).json({ error: 'Invalid OTP' });
    }
    
    // Find or create user in MongoDB
    let user = await User.findOne({ phone });
    
    if (!user) {
      user = await User.create({
        phone,
        name: name || null,
      });
    } else if (name && !user.name) {
      user.name = name;
      await user.save();
    }
    
    const token = generateToken(user._id, user.phone);
    
    res.json({
      token,
      user: {
        id: user._id,
        phone: user.phone,
        name: user.name,
        totalRides: user.totalRides,
        totalSaved: user.totalSaved,
        rating: user.rating,
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

// GET /api/v1/me - Get current user profile
router.get('/me', verifyAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      id: user._id,
      phone: user.phone,
      name: user.name,
      email: user.email,
      rating: user.rating,
      totalRides: user.totalRides,
      totalDistance: user.totalDistance,
      totalSaved: user.totalSaved,
      timeSaved: user.timeSaved,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// POST /api/v1/me/update - Update user profile
router.post('/me/update', verifyAuth, async (req, res) => {
  try {
    const { name, email } = req.body;
    
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (name) user.name = name;
    if (email) user.email = email;
    
    await user.save();
    
    res.json({
      id: user._id,
      phone: user.phone,
      name: user.name,
      email: user.email,
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

export default router;
