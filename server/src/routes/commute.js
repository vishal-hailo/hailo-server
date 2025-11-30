import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyAuth } from '../middleware/auth.js';
import { getEstimate, getSurgeRadar, generateDeepLink } from '../services/uberService.js';

const router = express.Router();
const prisma = new PrismaClient();

// All routes require authentication
router.use(verifyAuth);

// POST /api/v1/commute/search
router.post('/search', async (req, res) => {
  try {
    const { mode, originLocationId, destLocationId, origin, destination } = req.body;
    
    let originCoords, destCoords;
    
    // Handle ROUTINE mode (saved locations)
    if (mode === 'ROUTINE') {
      if (!originLocationId || !destLocationId) {
        return res.status(400).json({ error: 'Location IDs required for ROUTINE mode' });
      }
      
      const originLoc = await prisma.location.findFirst({
        where: { id: originLocationId, userId: req.user.userId }
      });
      const destLoc = await prisma.location.findFirst({
        where: { id: destLocationId, userId: req.user.userId }
      });
      
      if (!originLoc || !destLoc) {
        return res.status(404).json({ error: 'Locations not found' });
      }
      
      originCoords = { latitude: originLoc.latitude, longitude: originLoc.longitude };
      destCoords = { latitude: destLoc.latitude, longitude: destLoc.longitude };
    } 
    // Handle EXPLORER mode (ad-hoc search)
    else if (mode === 'EXPLORER') {
      if (!origin || !destination) {
        return res.status(400).json({ error: 'Origin and destination required for EXPLORER mode' });
      }
      originCoords = origin;
      destCoords = destination;
    } else {
      return res.status(400).json({ error: 'Invalid mode' });
    }
    
    // Get Uber estimate
    const estimate = await getEstimate(originCoords, destCoords);
    
    // Generate deep link
    const deepLinkUrl = generateDeepLink(originCoords, destCoords);
    
    // Log commute search
    const log = await prisma.commuteLog.create({
      data: {
        userId: req.user.userId,
        originLocationId: originLocationId || null,
        destLocationId: destLocationId || null,
        originLat: originCoords.latitude,
        originLng: originCoords.longitude,
        destLat: destCoords.latitude,
        destLng: destCoords.longitude,
        uberEstimateMin: estimate.priceMin,
        uberEstimateMax: estimate.priceMax,
        uberCurrency: estimate.currency,
        etaSeconds: estimate.etaMinutes * 60,
        surgePercent: estimate.surgePercent
      }
    });
    
    res.json({
      commuteLogId: log.id,
      productName: estimate.product,
      etaMinutes: estimate.etaMinutes,
      estimateMin: estimate.priceMin,
      estimateMax: estimate.priceMax,
      currency: estimate.currency,
      distance: estimate.distance,
      surgePercent: estimate.surgePercent,
      deepLinkUrl,
      isMock: estimate.isMock || false
    });
  } catch (error) {
    console.error('Commute search error:', error);
    res.status(500).json({ error: 'Failed to search commute', message: error.message });
  }
});

// POST /api/v1/commute/surge-radar
router.post('/surge-radar', async (req, res) => {
  try {
    const { originLocationId, destLocationId, origin, destination, durationMinutes = 30 } = req.body;
    
    let originCoords, destCoords;
    
    if (originLocationId && destLocationId) {
      const originLoc = await prisma.location.findFirst({
        where: { id: originLocationId, userId: req.user.userId }
      });
      const destLoc = await prisma.location.findFirst({
        where: { id: destLocationId, userId: req.user.userId }
      });
      
      if (!originLoc || !destLoc) {
        return res.status(404).json({ error: 'Locations not found' });
      }
      
      originCoords = { latitude: originLoc.latitude, longitude: originLoc.longitude };
      destCoords = { latitude: destLoc.latitude, longitude: destLoc.longitude };
    } else if (origin && destination) {
      originCoords = origin;
      destCoords = destination;
    } else {
      return res.status(400).json({ error: 'Coordinates required' });
    }
    
    // Get surge radar data
    const surgeData = await getSurgeRadar(originCoords, destCoords, durationMinutes);
    
    res.json(surgeData);
  } catch (error) {
    console.error('Surge radar error:', error);
    res.status(500).json({ error: 'Failed to get surge radar', message: error.message });
  }
});

// POST /api/v1/commute/handoff
router.post('/handoff', async (req, res) => {
  try {
    const { commuteLogId } = req.body;
    
    if (!commuteLogId) {
      return res.status(400).json({ error: 'commuteLogId required' });
    }
    
    // Update log to mark handoff clicked
    const log = await prisma.commuteLog.updateMany({
      where: {
        id: commuteLogId,
        userId: req.user.userId
      },
      data: {
        handoffClicked: true
      }
    });
    
    if (log.count === 0) {
      return res.status(404).json({ error: 'Commute log not found' });
    }
    
    res.json({ success: true, message: 'Handoff tracked' });
  } catch (error) {
    console.error('Handoff error:', error);
    res.status(500).json({ error: 'Failed to track handoff' });
  }
});

export default router;
