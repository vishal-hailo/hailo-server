import express from 'express';
import { verifyAuth } from '../middleware/auth.js';
import Location from '../models/Location.js';

const router = express.Router();

// GET /api/v1/locations - Get all user locations
router.get('/', verifyAuth, async (req, res) => {
  try {
    const locations = await Location.find({ userId: req.userId }).sort({ isPrimary: -1, createdAt: -1 });
    res.json(locations);
  } catch (error) {
    console.error('Get locations error:', error);
    res.status(500).json({ error: 'Failed to get locations' });
  }
});

// POST /api/v1/locations - Create a new location
router.post('/', verifyAuth, async (req, res) => {
  try {
    const { label, type, address, latitude, longitude, isPrimary } = req.body;
    
    if (!label || !type || !address) {
      return res.status(400).json({ error: 'Label, type, and address are required' });
    }
    
    // If this is set as primary, unset other primary locations of the same type
    if (isPrimary) {
      await Location.updateMany(
        { userId: req.userId, type },
        { isPrimary: false }
      );
    }
    
    const location = await Location.create({
      userId: req.userId,
      label,
      type,
      address,
      latitude,
      longitude,
      isPrimary: isPrimary || false,
    });
    
    res.status(201).json(location);
  } catch (error) {
    console.error('Create location error:', error);
    res.status(500).json({ error: 'Failed to create location' });
  }
});

// PUT /api/v1/locations/:id - Update a location
router.put('/:id', verifyAuth, async (req, res) => {
  try {
    const { label, type, address, latitude, longitude, isPrimary } = req.body;
    
    const location = await Location.findOne({ _id: req.params.id, userId: req.userId });
    
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }
    
    // If this is set as primary, unset other primary locations of the same type
    if (isPrimary && !location.isPrimary) {
      await Location.updateMany(
        { userId: req.userId, type: location.type, _id: { $ne: location._id } },
        { isPrimary: false }
      );
    }
    
    if (label) location.label = label;
    if (type) location.type = type;
    if (address) location.address = address;
    if (latitude !== undefined) location.latitude = latitude;
    if (longitude !== undefined) location.longitude = longitude;
    if (isPrimary !== undefined) location.isPrimary = isPrimary;
    
    await location.save();
    res.json(location);
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
});

// DELETE /api/v1/locations/:id - Delete a location
router.delete('/:id', verifyAuth, async (req, res) => {
  try {
    const location = await Location.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    
    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }
    
    res.json({ message: 'Location deleted successfully' });
  } catch (error) {
    console.error('Delete location error:', error);
    res.status(500).json({ error: 'Failed to delete location' });
  }
});

export default router;