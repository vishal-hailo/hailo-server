import express from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { verifyAuth } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'hailo-super-secret-jwt-key-mumbai-2025';

// Get Uber Auth URL
router.get('/url', verifyAuth, (req, res) => {
    const CLIENT_ID = process.env.UBER_CLIENT_ID;
    const REDIRECT_URI = process.env.UBER_REDIRECT_URI;

    if (!CLIENT_ID || !REDIRECT_URI) {
        return res.status(500).json({ error: 'Uber credentials not configured' });
    }

    // Encode userId in state to identify user on callback
    const state = jwt.sign({ userId: req.userId }, JWT_SECRET, { expiresIn: '1h' });

    const authUrl = `https://login.uber.com/oauth/v2/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${REDIRECT_URI}&scope=profile%20ride_request%20history&state=${state}`;

    res.json({ url: authUrl });
});

// Handle Callback (GET request from Browser)
router.get('/callback', async (req, res) => {
    const { code, state, error } = req.query;

    if (error) {
        return res.redirect(`hailo://settings/linked-accounts?status=error&message=${error}`);
    }

    if (!code || !state) {
        return res.redirect('hailo://settings/linked-accounts?status=error&message=Missing code or state');
    }

    try {
        // Verify state to get userId
        const decoded = jwt.verify(state, JWT_SECRET);
        const userId = decoded.userId;

        const params = new URLSearchParams();
        params.append('client_id', process.env.UBER_CLIENT_ID);
        params.append('client_secret', process.env.UBER_CLIENT_SECRET);
        params.append('grant_type', 'authorization_code');
        params.append('redirect_uri', process.env.UBER_REDIRECT_URI);
        params.append('code', code);

        const response = await axios.post('https://login.uber.com/oauth/v2/token', params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const { access_token, refresh_token, expires_in, scope, token_type } = response.data;

        // Calculate expiry
        const expiresAt = new Date(Date.now() + expires_in * 1000);

        // Update user
        const user = await User.findById(userId);
        if (!user) {
            return res.redirect('hailo://settings/linked-accounts?status=error&message=User not found');
        }

        user.linkedAccounts = user.linkedAccounts || {};
        user.linkedAccounts.uber = {
            accessToken: access_token,
            refreshToken: refresh_token,
            expiresAt: expiresAt,
            tokenType: token_type,
            scope: scope,
            linkedAt: Date.now()
        };

        await user.save();

        return res.redirect('hailo://settings/linked-accounts?status=success&platform=uber');
    } catch (err) {
        console.error('Uber Auth Error:', err.response?.data || err.message);
        const msg = err.response?.data?.error || 'Failed to link account';
        return res.redirect(`hailo://settings/linked-accounts?status=error&message=${encodeURIComponent(msg)}`);
    }
});

// Disconnect Uber
router.post('/disconnect', verifyAuth, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Optional: Revoke token with Uber API if needed
        if (user.linkedAccounts?.uber) {
            user.linkedAccounts.uber = undefined;
            await user.save();
        }

        res.json({ success: true, message: 'Uber account disconnected' });
    } catch (error) {
        console.error('Uber Disconnect Error:', error);
        res.status(500).json({ error: 'Failed to disconnect Uber account' });
    }
});

export default router;
