import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyAuth } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// All routes require authentication
router.use(verifyAuth);

// GET /api/v1/locations
router.get('/', async (req, res) => {
  try {
    const locations = await prisma.location.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json(locations);
  } catch (error) {
    console.error('Get locations error:', error);
    res.status(500).json({ error: 'Failed to get locations' });
  }
});

// POST /api/v1/locations
router.post('/', async (req, res) => {
  try {
    const { type, label, address, latitude, longitude } = req.body;
    
    if (!type || !label || !address || latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (!['HOME', 'OFFICE', 'OTHER'].includes(type)) {
      return res.status(400).json({ error: 'Invalid location type' });
    }
    
    const location = await prisma.location.create({
      data: {
        userId: req.user.userId,
        type,
        label,
        address,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      }
    });
    
    res.status(201).json(location);
  } catch (error) {
    console.error('Create location error:', error);
    res.status(500).json({ error: 'Failed to create location' });
  }
});

// PUT /api/v1/locations/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, label, address, latitude, longitude } = req.body;
    
    // Check ownership
    const existing = await prisma.location.findFirst({
      where: { id, userId: req.user.userId }
    });
    
    if (!existing) {
      return res.status(404).json({ error: 'Location not found' });
    }
    
    const location = await prisma.location.update({
      where: { id },
      data: {
        ...(type && { type }),
        ...(label && { label }),
        ...(address && { address }),
        ...(latitude !== undefined && { latitude: parseFloat(latitude) }),
        ...(longitude !== undefined && { longitude: parseFloat(longitude) })
      }
    });
    
    res.json(location);
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({ error: 'Failed to update location' });
  }
});

// DELETE /api/v1/locations/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check ownership
    const existing = await prisma.location.findFirst({
      where: { id, userId: req.user.userId }
    });
    
    if (!existing) {
      return res.status(404).json({ error: 'Location not found' });
    }
    
    await prisma.location.delete({ where: { id } });
    
    res.json({ success: true, message: 'Location deleted' });
  } catch (error) {
    console.error('Delete location error:', error);
    res.status(500).json({ error: 'Failed to delete location' });
  }
});

export default router;
