import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyAuth } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// All routes require authentication
router.use(verifyAuth);

// GET /api/v1/insights/summary
router.get('/summary', async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    // Calculate date range
    const days = period === '30d' ? 30 : 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Get commute logs
    const logs = await prisma.commuteLog.findMany({
      where: {
        userId: req.user.userId,
        searchedAt: {
          gte: startDate
        }
      },
      orderBy: {
        searchedAt: 'desc'
      }
    });
    
    // Calculate insights
    const totalTrips = logs.filter(log => log.handoffClicked).length;
    const totalSearches = logs.length;
    
    let totalSpend = 0;
    let totalSavings = 0;
    
    logs.forEach(log => {
      if (log.handoffClicked && log.uberEstimateMin && log.uberEstimateMax) {
        const avgPrice = (log.uberEstimateMin + log.uberEstimateMax) / 2;
        totalSpend += avgPrice;
        
        // Estimate savings (assume baseline is 20% higher without surge intelligence)
        const baseline = avgPrice * 1.2;
        totalSavings += (baseline - avgPrice);
      }
    });
    
    const avgPerTrip = totalTrips > 0 ? Math.round(totalSpend / totalTrips) : 0;
    
    // Calculate week score (0-10 based on usage and savings)
    const usageScore = Math.min(totalSearches / 10, 5); // Max 5 points for usage
    const savingsScore = Math.min(totalSavings / 100, 5); // Max 5 points for savings
    const weekScore = (usageScore + savingsScore).toFixed(1);
    
    res.json({
      period,
      totalTrips,
      totalSearches,
      totalSpend: Math.round(totalSpend),
      totalSavings: Math.round(totalSavings),
      avgPerTrip,
      weekScore: parseFloat(weekScore),
      currency: 'INR'
    });
  } catch (error) {
    console.error('Insights summary error:', error);
    res.status(500).json({ error: 'Failed to get insights' });
  }
});

// GET /api/v1/insights/export
router.get('/export', async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    const days = period === '30d' ? 30 : 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    const logs = await prisma.commuteLog.findMany({
      where: {
        userId: req.user.userId,
        searchedAt: {
          gte: startDate
        }
      },
      include: {
        originLocation: true,
        destLocation: true
      },
      orderBy: {
        searchedAt: 'desc'
      }
    });
    
    // Generate CSV
    let csv = 'Date,Origin,Destination,ETA (min),Price Min,Price Max,Surge %,Booked\n';
    
    logs.forEach(log => {
      const date = new Date(log.searchedAt).toLocaleString();
      const origin = log.originLocation?.label || `${log.originLat},${log.originLng}`;
      const dest = log.destLocation?.label || `${log.destLat},${log.destLng}`;
      const eta = log.etaSeconds ? Math.round(log.etaSeconds / 60) : 'N/A';
      const priceMin = log.uberEstimateMin || 'N/A';
      const priceMax = log.uberEstimateMax || 'N/A';
      const surge = log.surgePercent ? log.surgePercent.toFixed(1) : '0';
      const booked = log.handoffClicked ? 'Yes' : 'No';
      
      csv += `${date},${origin},${dest},${eta},${priceMin},${priceMax},${surge},${booked}\n`;
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=hailo-export-${period}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Insights export error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

export default router;
