import express from 'express';
import { PrismaClient } from '@prisma/client';
import { generateToken, verifyAuth } from '../middleware/auth.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const prisma = new PrismaClient();

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
    
    // Find or create user
    let user = await prisma.user.findUnique({ where: { phone } });
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          phone,
          name: name || null
        }
      });
    } else if (name && !user.name) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { name }
      });
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

// GET /api/v1/me
router.get('/', verifyAuth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        locations: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      id: user.id,
      phone: user.phone,
      name: user.name,
      locations: user.locations,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

export default router;
