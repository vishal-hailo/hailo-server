import express from 'express';
import { verifyAuth } from '../middleware/auth.js';
import Ride from '../models/Ride.js';
import User from '../models/User.js';
import Insight from '../models/Insight.js';

const router = express.Router();

// GET /api/v1/insights/summary - Get user insights summary
router.get('/summary', verifyAuth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get completed rides for calculations
    const completedRides = await Ride.find({
      userId: req.userId,
      type: 'COMPLETED',
    });
    
    // Calculate stats
    const totalRides = completedRides.length;
    const totalDistance = completedRides.reduce((sum, ride) => sum + (ride.distance || 0), 0);
    const totalSpent = completedRides.reduce((sum, ride) => sum + (ride.price || 0), 0);
    const totalSaved = completedRides.reduce((sum, ride) => sum + (ride.savedAmount || 0), 0);
    const avgPricePerRide = totalRides > 0 ? totalSpent / totalRides : 0;
    
    // Calculate savings breakdown
    const savingsBreakdown = [
      {
        id: 'surge',
        title: 'Surge Timing',
        subtitle: `Avoided ${Math.floor(totalRides * 0.3)} peak surge periods`,
        amount: Math.floor(totalSaved * 0.68),
        icon: 'flash',
        iconColor: '#F97316',
        iconBg: '#FED7AA',
      },
      {
        id: 'weather',
        title: 'Weather Predictions',
        subtitle: `Pre-booked before ${Math.floor(totalRides * 0.1)} rain events`,
        amount: Math.floor(totalSaved * 0.14),
        icon: 'cloudy',
        iconColor: '#3B82F6',
        iconBg: '#DBEAFE',
      },
      {
        id: 'traffic',
        title: 'Traffic Optimization',
        subtitle: `Optimal route timing ${Math.floor(totalRides * 0.4)} times`,
        amount: Math.floor(totalSaved * 0.18),
        icon: 'stats-chart',
        iconColor: '#8B5CF6',
        iconBg: '#EDE9FE',
      },
    ];
    
    // Get top routes
    const routeMap = {};
    completedRides.forEach(ride => {
      const routeKey = `${ride.from.label || ride.from.address} → ${ride.to.label || ride.to.address}`;
      if (!routeMap[routeKey]) {
        routeMap[routeKey] = {
          from: ride.from.label || ride.from.address,
          to: ride.to.label || ride.to.address,
          rides: 0,
          saved: 0,
        };
      }
      routeMap[routeKey].rides++;
      routeMap[routeKey].saved += ride.savedAmount || 0;
    });
    
    const topRoutes = Object.values(routeMap)
      .sort((a, b) => b.rides - a.rides)
      .slice(0, 3)
      .map((route, index) => ({ id: index + 1, ...route }));
    
    res.json({
      stats: {
        totalRides,
        totalDistance: Math.round(totalDistance * 10) / 10,
        totalSaved: Math.round(totalSaved),
        totalSpent: Math.round(totalSpent),
        avgPricePerRide: Math.round(avgPricePerRide),
        timeSaved: user.timeSaved,
        rating: user.rating || 4.9,
      },
      savingsBreakdown,
      topRoutes,
    });
  } catch (error) {
    console.error('Get insights error:', error);
    res.status(500).json({ error: 'Failed to get insights' });
  }
});

// GET /api/v1/insights/recommendations - Get smart recommendations
router.get('/recommendations', verifyAuth, async (req, res) => {
  try {
    const rides = await Ride.find({
      userId: req.userId,
      type: 'COMPLETED',
    }).sort({ completedTime: -1 }).limit(50);
    
    // Analyze ride patterns
    const hourMap = {};
    rides.forEach(ride => {
      const hour = new Date(ride.scheduledTime).getHours();
      if (!hourMap[hour]) {
        hourMap[hour] = { count: 0, avgPrice: 0, totalPrice: 0 };
      }
      hourMap[hour].count++;
      hourMap[hour].totalPrice += ride.price || 0;
      hourMap[hour].avgPrice = hourMap[hour].totalPrice / hourMap[hour].count;
    });
    
    // Find cheapest and peak hours
    const hours = Object.entries(hourMap).sort((a, b) => a[1].avgPrice - b[1].avgPrice);
    const cheapestHour = hours[0]?.[0] || '9';
    const peakHour = hours[hours.length - 1]?.[0] || '18';
    
    const recommendations = [
      {
        id: 1,
        type: 'timing',
        title: 'Best Booking Time',
        description: `Your cheapest rides are usually around ${cheapestHour}:00. Consider adjusting your schedule.`,
        icon: 'time',
        priority: 'high',
      },
      {
        id: 2,
        type: 'surge',
        title: 'Avoid Peak Hours',
        description: `Book rides after ${peakHour}:00 to save an average of 15-20%. Your peak hour rides cost 18% more.`,
        icon: 'flash',
        priority: 'high',
      },
      {
        id: 3,
        type: 'schedule',
        title: 'Schedule in Advance',
        description: 'Pre-booking rides helps you avoid surge pricing during rush hours and rain.',
        icon: 'calendar',
        priority: 'medium',
      },
    ];
    
    res.json(recommendations);
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

export default router;