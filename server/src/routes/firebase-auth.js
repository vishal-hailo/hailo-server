import express from 'express';
import { generateToken } from '../middleware/auth.js';
import { verifyFirebaseToken } from '../config/firebase.js';
import User from '../models/User.js';

const router = express.Router();

// Health check for Firebase
router.get('/firebase-test', (req, res) => {
  try {
    res.json({
      status: 'Firebase Admin SDK loaded',
      configured: !!process.env.FIREBASE_PROJECT_ID || !!process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
      message: 'Firebase Phone Auth is ready'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

// POST /api/v1/auth/firebase-login
// Verify Firebase ID token and create/login user
router.post('/firebase-login', async (req, res) => {
  try {
    const { firebaseIdToken } = req.body;

    if (!firebaseIdToken) {
      return res.status(400).json({ error: 'Firebase ID token is required' });
    }

    // Verify the Firebase token
    let decodedToken;
    try {
      decodedToken = await verifyFirebaseToken(firebaseIdToken);
    } catch (error) {
      console.error('Firebase token verification failed:', error.message);
      return res.status(401).json({
        error: 'Invalid Firebase token',
        details: error.message
      });
    }

    // Extract phone number from Firebase token
    const phone = decodedToken.phone_number;
    if (!phone) {
      return res.status(400).json({
        error: 'Phone number not found in Firebase token'
      });
    }

    // Find or create user in our database
    let user = await User.findOne({ phone });

    if (!user) {
      // Create new user
      user = await User.create({
        phone,
        name: null // Will be set during registration
      });
      console.log('✅ New user created:', phone);
    } else {
      console.log('✅ Existing user logged in:', phone);
    }

    // Generate our JWT token
    const token = generateToken(user._id, user.phone);

    res.json({
      token,
      user: {
        id: user._id,
        phone: user.phone,
        name: user.name,
        email: user.email,
        rating: user.rating,
        totalRides: user.totalRides,
        totalDistance: user.totalDistance,
        totalSaved: user.totalSaved,
        timeSaved: user.timeSaved,
        settings: user.settings,
      }
    });
  } catch (error) {
    console.error('Firebase login error:', error);
    res.status(500).json({
      error: 'Failed to authenticate with Firebase',
      message: error.message
    });
  }
});

export default router;
