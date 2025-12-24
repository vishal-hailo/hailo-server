import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/v1/surge/forecast
 * Get surge price forecasts for next hour
 */
router.get('/forecast', async (req, res) => {
  try {
    const { originLat, originLng, destLat, destLng } = req.query;

    // Simulate surge forecasting based on time of day and historical patterns
    const currentHour = new Date().getHours();
    const currentMinute = new Date().getMinutes();

    const generateSurgeForecast = (minutesAhead) => {
      const futureHour = Math.floor((currentMinute + minutesAhead) / 60) + currentHour;
      const futureMinute = (currentMinute + minutesAhead) % 60;
      
      // Peak hours: 8-10 AM and 5-8 PM have higher surge
      const isPeakMorning = futureHour >= 8 && futureHour < 10;
      const isPeakEvening = futureHour >= 17 && futureHour < 20;
      
      let baseMultiplier = 1.0;
      
      if (isPeakMorning || isPeakEvening) {
        baseMultiplier = 1.2 + Math.random() * 0.3; // 1.2x - 1.5x
      } else if (futureHour >= 6 && futureHour < 22) {
        baseMultiplier = 1.0 + Math.random() * 0.2; // 1.0x - 1.2x
      } else {
        baseMultiplier = 0; // No surge at night
      }

      return {
        multiplier: Math.round(baseMultiplier * 10) / 10,
        time: minutesAhead === 0 ? 'Now' : `${minutesAhead}m`,
        timestamp: new Date(Date.now() + minutesAhead * 60000).toISOString(),
      };
    };

    const forecast = [
      generateSurgeForecast(0),
      generateSurgeForecast(15),
      generateSurgeForecast(30),
      generateSurgeForecast(45),
      generateSurgeForecast(60),
    ];

    res.json({
      forecast,
      location: {
        origin: { lat: parseFloat(originLat), lng: parseFloat(originLng) },
        destination: { lat: parseFloat(destLat), lng: parseFloat(destLng) },
      },
    });
  } catch (error) {
    console.error('Surge forecast error:', error);
    res.status(500).json({ error: 'Failed to generate surge forecast' });
  }
});

/**
 * GET /api/v1/surge/current
 * Get current surge multiplier for a location
 */
router.get('/current', async (req, res) => {
  try {
    const { lat, lng } = req.query;
    const currentHour = new Date().getHours();

    // Simulate current surge based on time
    let multiplier = 1.0;
    if (currentHour >= 8 && currentHour < 10) {
      multiplier = 1.3;
    } else if (currentHour >= 17 && currentHour < 20) {
      multiplier = 1.4;
    } else if (currentHour >= 12 && currentHour < 14) {
      multiplier = 1.1;
    }

    res.json({
      multiplier: Math.round(multiplier * 10) / 10,
      location: { lat: parseFloat(lat), lng: parseFloat(lng) },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Current surge error:', error);
    res.status(500).json({ error: 'Failed to get current surge' });
  }
});

export default router;
