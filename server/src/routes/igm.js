import express from 'express';
import { igmService } from '../services/igmService.js';

const router = express.Router();

/**
 * POST /api/v1/igm/issue
 * Client raises an issue (Buyer App -> ONDC)
 */
router.post('/issue', async (req, res) => {
    try {
        const { transactionId, category, subCategory, description, userId } = req.body;

        if (!transactionId || !category || !description) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const grievance = await igmService.createIssue({
            transactionId, category, subCategory, description, userId
        });

        res.json({ success: true, grievance });
    } catch (error) {
        console.error('Raise Issue Failed:', error);
        res.status(500).json({ error: 'Failed to raise issue' });
    }
});

/**
 * GET /api/v1/igm/issue/:issueId
 * Get status of an issue
 */
router.get('/issue/:issueId', async (req, res) => {
    try {
        const grievance = await igmService.getStatus(req.params.issueId);
        if (!grievance) return res.status(404).json({ error: 'Issue not found' });
        res.json(grievance);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
