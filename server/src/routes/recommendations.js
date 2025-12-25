import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/v1/recommendations/smart
 * Get personalized smart recommendations based on user patterns
 */
router.get('/smart', async (req, res) => {
  try {
    const userId = req.userId; // From auth middleware
    const currentHour = new Date().getHours();
    const currentDay = new Date().getDay();

    // Get user's commute logs from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const commuteLogs = await prisma.commuteLog.findMany({
      where: {
        userId,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      include: {
        origin: true,
        destination: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    });

    if (commuteLogs.length === 0) {
      return res.json({
        hasRecommendation: false,
        message: 'Not enough data for smart recommendations yet',
      });
    }

    // Analyze patterns
    const patterns = analyzeCommutePatterns(commuteLogs, currentHour, currentDay);
    
    // Generate recommendation
    const recommendation = generateRecommendation(patterns, currentHour);

    res.json(recommendation);
  } catch (error) {
    console.error('Smart recommendations error:', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

/**
 * Analyze user commute patterns
 */
function analyzeCommutePatterns(logs, currentHour, currentDay) {
  const hourlyRides = {};
  const routeFrequency = {};
  const dayOfWeekRides = {};

  logs.forEach(log => {
    const hour = new Date(log.createdAt).getHours();
    const day = new Date(log.createdAt).getDay();
    const route = `${log.origin.label}-${log.destination.label}`;

    // Track hourly patterns
    hourlyRides[hour] = (hourlyRides[hour] || 0) + 1;

    // Track route frequency
    routeFrequency[route] = {
      count: (routeFrequency[route]?.count || 0) + 1,
      origin: log.origin,
      destination: log.destination,
      avgPrice: ((routeFrequency[route]?.avgPrice || 0) * (routeFrequency[route]?.count || 0) + log.estimateMin) / ((routeFrequency[route]?.count || 0) + 1),
    };

    // Track day of week patterns
    dayOfWeekRides[day] = (dayOfWeekRides[day] || 0) + 1;
  });

  return {
    hourlyRides,
    routeFrequency,
    dayOfWeekRides,
    mostFrequentRoute: Object.entries(routeFrequency).sort((a, b) => b[1].count - a[1].count)[0],
  };
}

/**
 * Generate smart recommendation based on patterns
 */
function generateRecommendation(patterns, currentHour) {
  const { mostFrequentRoute, hourlyRides } = patterns;

  if (!mostFrequentRoute) {
    return {
      hasRecommendation: false,
      message: 'Not enough data',
    };
  }

  const [routeName, routeData] = mostFrequentRoute;
  const usualHour = Object.entries(hourlyRides).sort((a, b) => b[1] - a[1])[0]?.[0];

  // Calculate potential savings
  const currentSurge = getCurrentSurgeMultiplier(currentHour);
  const usualSurge = getCurrentSurgeMultiplier(parseInt(usualHour));
  const savingsPercent = Math.round(((currentSurge - usualSurge) / currentSurge) * 100);
  const savingsAmount = Math.round(routeData.avgPrice * (savingsPercent / 100));

  // Generate advice
  let advice = '';
  if (currentHour >= 17 && currentHour < 20) {
    advice = `Wait 15 mins for no surge. Uber Go is cheapest via Uber at ₹${Math.round(routeData.avgPrice * 0.9)}`;
  } else if (currentHour >= 8 && currentHour < 10) {
    advice = `Morning rush hour. Consider leaving at ${usualHour}:30 AM to save ${savingsPercent}%`;
  } else {
    advice = `Good time to book! Prices are ${savingsPercent}% lower than peak hours`;
  }

  return {
    hasRecommendation: true,
    destination: routeData.destination.label,
    subtext: `Your usual ${usualHour}:30 ${currentHour < 12 ? 'AM' : 'PM'} ride`,
    savingsPercent: Math.max(0, savingsPercent),
    estimatedPrice: Math.round(routeData.avgPrice),
    advice,
    origin: routeData.origin,
    destination: routeData.destination,
  };
}

/**
 * Get current surge multiplier (simplified)
 */
function getCurrentSurgeMultiplier(hour) {
  if (hour >= 8 && hour < 10) return 1.3;
  if (hour >= 17 && hour < 20) return 1.4;
  if (hour >= 12 && hour < 14) return 1.1;
  return 1.0;
}

export default router;
