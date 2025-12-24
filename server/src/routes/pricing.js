import express from 'express';

const router = express.Router();

/**
 * GET /api/v1/pricing/factors
 * Get real-time pricing factors (weather, traffic, peak hours)
 */
router.get('/factors', async (req, res) => {
  try {
    const currentHour = new Date().getHours();
    const currentDay = new Date().getDay(); // 0 = Sunday, 6 = Saturday

    // Simulate weather impact
    const weatherConditions = ['Clear', 'Light rain', 'Heavy rain', 'Cloudy'];
    const weatherImpact = [0, 8, 20, 3];
    const randomWeather = Math.floor(Math.random() * weatherConditions.length);

    // Simulate traffic density
    let trafficImpact = 5;
    if (currentHour >= 8 && currentHour < 10) trafficImpact = 15; // Morning rush
    else if (currentHour >= 17 && currentHour < 20) trafficImpact = 18; // Evening rush
    else if (currentHour >= 12 && currentHour < 14) trafficImpact = 12; // Lunch time
    
    const trafficLevel = trafficImpact > 15 ? 'Heavy traffic' : trafficImpact > 10 ? 'Moderate traffic' : 'Light traffic';

    // Peak hours detection
    const isPeakHour = (currentHour >= 8 && currentHour < 10) || (currentHour >= 17 && currentHour < 20);
    const peakHourImpact = isPeakHour ? 15 : 0;
    const peakHourText = isPeakHour 
      ? currentHour < 12 ? 'Morning rush (8-10 AM)' : 'Evening rush (5-8 PM)'
      : 'Off-peak hours';

    // Weekend adjustment
    const isWeekend = currentDay === 0 || currentDay === 6;
    const weekendAdjustment = isWeekend ? -5 : 0;

    const factors = [
      {
        id: 'weather',
        title: 'Weather Impact',
        description: weatherConditions[randomWeather],
        impact: weatherImpact[randomWeather] + weekendAdjustment,
        icon: 'cloud',
        color: weatherImpact[randomWeather] > 10 ? 'warning' : 'success',
      },
      {
        id: 'traffic',
        title: 'Traffic Density',
        description: trafficLevel,
        impact: trafficImpact + weekendAdjustment,
        icon: 'car',
        color: trafficImpact > 15 ? 'error' : trafficImpact > 10 ? 'warning' : 'success',
      },
      {
        id: 'peak',
        title: 'Peak Hours',
        description: peakHourText,
        impact: peakHourImpact,
        icon: 'time',
        color: isPeakHour ? 'error' : 'success',
      },
    ];

    const totalImpact = factors.reduce((sum, factor) => sum + factor.impact, 0);

    res.json({
      factors,
      totalImpact: Math.max(0, totalImpact),
      timestamp: new Date().toISOString(),
      isLive: true,
    });
  } catch (error) {
    console.error('Pricing factors error:', error);
    res.status(500).json({ error: 'Failed to get pricing factors' });
  }
});

/**
 * GET /api/v1/pricing/estimate
 * Get price estimate with breakdown
 */
router.get('/estimate', async (req, res) => {
  try {
    const { distance, duration, surgeMultiplier = 1.0 } = req.query;

    const baseFare = 40; // Base fare in INR
    const perKm = 12; // Per km rate
    const perMin = 2; // Per minute rate

    const distanceCharge = parseFloat(distance) * perKm;
    const timeCharge = parseFloat(duration) * perMin;
    const subtotal = baseFare + distanceCharge + timeCharge;
    
    const surgeCharge = subtotal * (parseFloat(surgeMultiplier) - 1);
    const total = subtotal + surgeCharge;

    res.json({
      breakdown: {
        baseFare,
        distanceCharge: Math.round(distanceCharge),
        timeCharge: Math.round(timeCharge),
        surgeCharge: Math.round(surgeCharge),
        subtotal: Math.round(subtotal),
        total: Math.round(total),
      },
      surgeMultiplier: parseFloat(surgeMultiplier),
      estimatedRange: {
        min: Math.round(total * 0.9),
        max: Math.round(total * 1.1),
      },
    });
  } catch (error) {
    console.error('Price estimate error:', error);
    res.status(500).json({ error: 'Failed to calculate estimate' });
  }
});

export default router;
