import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/database.js';
import authRoutes from './routes/auth.js';
import firebaseAuthRoutes from './routes/firebase-auth.js';
import locationRoutes from './routes/locations-mongo.js';
import ridesRoutes from './routes/rides.js';
import insightsRoutes from './routes/insights-mongo.js';
import commuteRoutes from './routes/commute.js';
import surgeRoutes from './routes/surge.js';
import pricingRoutes from './routes/pricing.js';
import recommendationsRoutes from './routes/recommendations.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    app: process.env.APP_NAME || 'HailO',
    version: process.env.APP_VERSION || '1.0.0',
    uberMode: process.env.UBER_MOCK === 'true' ? 'MOCK' : 'REAL',
    database: 'MongoDB',
    firebaseAuth: 'enabled'
  });
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/auth', firebaseAuthRoutes); // Firebase Phone Auth routes
app.use('/api/v1', authRoutes); // For /me routes
app.use('/api/v1/locations', locationRoutes);
app.use('/api/v1/rides', ridesRoutes);
app.use('/api/v1/insights', insightsRoutes);
app.use('/api/v1/commute', commuteRoutes);
app.use('/api/v1/surge', surgeRoutes);
app.use('/api/v1/pricing', pricingRoutes);
app.use('/api/v1/recommendations', recommendationsRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 HailO Server running on port ${PORT}`);
  console.log(`📍 Uber Mode: ${process.env.UBER_MOCK === 'true' ? 'MOCK (Mumbai data)' : 'REAL API'}`);
  console.log(`💾 Database: MongoDB`);
});
