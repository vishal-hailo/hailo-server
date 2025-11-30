import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import locationRoutes from './routes/locations.js';
import commuteRoutes from './routes/commute.js';
import insightsRoutes from './routes/insights.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/v1/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    app: process.env.APP_NAME,
    version: process.env.APP_VERSION,
    uberMode: process.env.UBER_MOCK === 'true' ? 'MOCK' : 'REAL'
  });
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/locations', locationRoutes);
app.use('/api/v1/commute', commuteRoutes);
app.use('/api/v1/insights', insightsRoutes);
app.use('/api/v1/me', authRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 HailO Server running on port ${PORT}`);
  console.log(`📍 Uber Mode: ${process.env.UBER_MOCK === 'true' ? 'MOCK (Mumbai data)' : 'REAL API'}`);
});
