import express from 'express';
import { generateToken, verifyAuth } from '../middleware/auth.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const MOCK_OTP = process.env.OTP_MOCK_CODE || '1234';

// In-memory user storage (for quick testing - replace with DB later)
const users = new Map();
let userIdCounter = 1;

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
    
    // Find or create user
    let user = users.get(phone);
    
    if (!user) {
      user = {
        id: userIdCounter++,
        phone,
        name: name || null,
        createdAt: new Date()
      };
      users.set(phone, user);
    } else if (name && !user.name) {
      user.name = name;
      users.set(phone, user);
    }
    
    const token = generateToken(user.id, user.phone);
    
    res.json({
      token,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name
      }
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
});

// POST /api/v1/me/update
router.post('/update', verifyAuth, async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.userId;
    
    // Find user by ID
    let user = null;
    for (const [phone, u] of users.entries()) {
      if (u.id === userId) {
        user = u;
        user.name = name;
        users.set(phone, user);
        break;
      }
    }
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      id: user.id,
      phone: user.phone,
      name: user.name
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

export default router;
