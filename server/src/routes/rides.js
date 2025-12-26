import express from 'express';
import { verifyAuth } from '../middleware/auth.js';
import Ride from '../models/Ride.js';
import User from '../models/User.js';

const router = express.Router();

// GET /api/v1/rides - Get all user rides
router.get('/', verifyAuth, async (req, res) => {
  try {
    const { type } = req.query; // SCHEDULED, COMPLETED, RECURRING
    
    const query = { userId: req.userId };
    if (type) {
      query.type = type;
    }
    
    const rides = await Ride.find(query).sort({ createdAt: -1 });
    res.json(rides);
  } catch (error) {
    console.error('Get rides error:', error);
    res.status(500).json({ error: 'Failed to get rides' });
  }
});

// GET /api/v1/rides/upcoming - Get upcoming scheduled rides
router.get('/upcoming', verifyAuth, async (req, res) => {
  try {
    const rides = await Ride.find({
      userId: req.userId,
      type: { $in: ['SCHEDULED', 'RECURRING'] },
      status: { $in: ['PENDING', 'CONFIRMED'] },
      scheduledTime: { $gte: new Date() },
    }).sort({ scheduledTime: 1 });
    
    res.json(rides);
  } catch (error) {
    console.error('Get upcoming rides error:', error);
    res.status(500).json({ error: 'Failed to get upcoming rides' });
  }
});

// GET /api/v1/rides/history - Get ride history
router.get('/history', verifyAuth, async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const rides = await Ride.find({
      userId: req.userId,
      type: 'COMPLETED',
    })
    .sort({ completedTime: -1 })
    .limit(parseInt(limit));
    
    res.json(rides);
  } catch (error) {
    console.error('Get ride history error:', error);
    res.status(500).json({ error: 'Failed to get ride history' });
  }
});

// POST /api/v1/rides - Schedule a new ride
router.post('/', verifyAuth, async (req, res) => {
  try {
    const { from, to, scheduledTime, estimatedPrice, recurringPattern } = req.body;
    
    if (!from || !to || !scheduledTime) {
      return res.status(400).json({ error: 'From, to, and scheduledTime are required' });
    }
    
    const type = recurringPattern?.enabled ? 'RECURRING' : 'SCHEDULED';
    
    const ride = await Ride.create({
      userId: req.userId,
      type,
      from,
      to,
      scheduledTime,
      estimatedPrice,
      status: 'PENDING',
      recurringPattern,
      provider: 'MOCK',
    });
    
    res.status(201).json(ride);
  } catch (error) {
    console.error('Create ride error:', error);
    res.status(500).json({ error: 'Failed to schedule ride' });
  }
});

// PUT /api/v1/rides/:id - Update a ride
router.put('/:id', verifyAuth, async (req, res) => {
  try {
    const ride = await Ride.findOne({ _id: req.params.id, userId: req.userId });
    
    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }
    
    const { scheduledTime, status, recurringPattern } = req.body;
    
    if (scheduledTime) ride.scheduledTime = scheduledTime;
    if (status) ride.status = status;
    if (recurringPattern) ride.recurringPattern = recurringPattern;
    
    await ride.save();
    res.json(ride);
  } catch (error) {
    console.error('Update ride error:', error);
    res.status(500).json({ error: 'Failed to update ride' });
  }
});

// POST /api/v1/rides/:id/complete - Mark ride as completed
router.post('/:id/complete', verifyAuth, async (req, res) => {
  try {
    const { price, distance, duration, savedAmount, driver } = req.body;
    
    const ride = await Ride.findOne({ _id: req.params.id, userId: req.userId });
    
    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }
    
    ride.type = 'COMPLETED';
    ride.status = 'COMPLETED';
    ride.completedTime = new Date();
    ride.price = price;
    ride.distance = distance;
    ride.duration = duration;
    ride.savedAmount = savedAmount || 0;
    ride.driver = driver;
    
    await ride.save();
    
    // Update user stats
    await User.findByIdAndUpdate(req.userId, {
      $inc: {
        totalRides: 1,
        totalDistance: distance || 0,
        totalSaved: savedAmount || 0,
        timeSaved: (duration || 0) / 60, // Convert to hours
      },
    });
    
    res.json(ride);
  } catch (error) {
    console.error('Complete ride error:', error);
    res.status(500).json({ error: 'Failed to complete ride' });
  }
});

// DELETE /api/v1/rides/:id - Cancel/delete a ride
router.delete('/:id', verifyAuth, async (req, res) => {
  try {
    const ride = await Ride.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    
    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }
    
    res.json({ message: 'Ride cancelled successfully' });
  } catch (error) {
    console.error('Delete ride error:', error);
    res.status(500).json({ error: 'Failed to cancel ride' });
  }
});

export default router;