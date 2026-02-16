import express from 'express';
import { ondcService } from '../services/ondcService.js';
import { igmService } from '../services/igmService.js';
import { reconService } from '../services/reconService.js';
import { ondcSignatureService } from '../services/ondcSignatureService.js';

const router = express.Router();

// Trigger ONDC Search
router.post('/search', async (req, res) => {
    try {
        const { latitude, longitude, destination } = req.body;
        if (!latitude || !longitude) {
            return res.status(400).json({ error: 'Location required' });
        }
        // Pass destination (optional) to service
        const result = await ondcService.search({ latitude, longitude, destination });
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Trigger ONDC Select
router.post('/select', async (req, res) => {
    try {
        const { transactionId, providerId, itemId } = req.body;
        if (!transactionId || !providerId || !itemId) {
            return res.status(400).json({ error: 'Missing required fields: transactionId, providerId, itemId' });
        }
        const result = await ondcService.select(transactionId, providerId, itemId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Trigger ONDC Init
router.post('/init', async (req, res) => {
    try {
        const { transactionId } = req.body;
        if (!transactionId) return res.status(400).json({ error: 'Missing transactionId' });
        const result = await ondcService.init(transactionId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Trigger ONDC Confirm
router.post('/confirm', async (req, res) => {
    try {
        const { transactionId } = req.body;
        if (!transactionId) return res.status(400).json({ error: 'Missing transactionId' });
        const result = await ondcService.confirm(transactionId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Trigger ONDC Cancel
router.post('/cancel', async (req, res) => {
    try {
        const { transactionId, reasonCode } = req.body;
        if (!transactionId) return res.status(400).json({ error: 'Missing transactionId' });
        const result = await ondcService.cancel(transactionId, reasonCode);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Trigger ONDC Status Check
router.post('/status', async (req, res) => {
    try {
        const { transactionId } = req.body;
        if (!transactionId) return res.status(400).json({ error: 'Missing transactionId' });
        const result = await ondcService.status(transactionId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET Results for a transaction
router.get('/results/:transactionId', (req, res) => {
    const results = ondcService.getResults(req.params.transactionId);
    res.json({ results });
});


// Middleware to verify ONDC signatures on incoming callbacks
import { verifyOndcSignature } from '../middleware/ondcAuth.js';
import { auditIncomingMiddleware } from '../middleware/auditLog.js';

// Apply Audit Middleware to ALL /ondc routes or specific callbacks?
// Protocol says we should log everything. 
// Let's apply it to callbacks specifically before auth to capture even failed auth attempts if desired?
// Actually, Audit usually happens for valid traffic. But debugging auth failures is also good.
// Let's chain them: audit -> verify.


/**
 * POST /ondc/on_search
 * Callback from BPP/BG with search results.
 */
router.post('/on_search', auditIncomingMiddleware, verifyOndcSignature, async (req, res) => {
    try {
        await ondcService.onSearch(req.body);
        // ONDC protocol requires immediate ACK
        res.json({ message: { ack: { status: 'ACK' } } });
    } catch (error) {
        console.error('Error handling on_search:', error);
        res.status(500).json({ message: { ack: { status: 'NACK' } } });
    }
});

/**
 * POST /ondc/on_select
 * Callback with detailed quote.
 */
router.post('/on_select', auditIncomingMiddleware, verifyOndcSignature, async (req, res) => {
    try {
        await ondcService.onSelect(req.body);
        res.json({ message: { ack: { status: 'ACK' } } });
    } catch (error) {
        console.error('Error handling on_select:', error);
        res.status(500).json({ message: { ack: { status: 'NACK' } } });
    }
});

/**
 * POST /ondc/on_init
 * Callback with initialization details.
 */
router.post('/on_init', auditIncomingMiddleware, verifyOndcSignature, async (req, res) => {
    try {
        await ondcService.onInit(req.body);
        res.json({ message: { ack: { status: 'ACK' } } });
    } catch (error) {
        console.error('Error handling on_init:', error);
        res.status(500).json({ message: { ack: { status: 'NACK' } } });
    }
});

/**
 * POST /ondc/on_confirm
 * Callback with confirmation details.
 */
router.post('/on_confirm', auditIncomingMiddleware, verifyOndcSignature, async (req, res) => {
    try {
        await ondcService.onConfirm(req.body);
        res.json({ message: { ack: { status: 'ACK' } } });
    } catch (error) {
        console.error('Error handling on_confirm:', error);
        res.status(500).json({ message: { ack: { status: 'NACK' } } });
    }
});

/**
 * POST /ondc/on_cancel
 * Callback for Cancellation
 */
router.post('/on_cancel', auditIncomingMiddleware, verifyOndcSignature, async (req, res) => {
    try {
        await ondcService.onCancel(req.body);
        res.json({ message: { ack: { status: 'ACK' } } });
    } catch (error) {
        console.error('Error handling on_cancel:', error);
        res.status(500).json({ message: { ack: { status: 'NACK' } } });
    }
});

/**
 * POST /ondc/on_status
 * Callback for Order Status Updates
 */
router.post('/on_status', auditIncomingMiddleware, verifyOndcSignature, async (req, res) => {
    try {
        await ondcService.onStatus(req.body);
        res.json({ message: { ack: { status: 'ACK' } } });
    } catch (error) {
        console.error('Error handling on_status:', error);
        res.status(500).json({ message: { ack: { status: 'NACK' } } });
    }
});

/**
 * POST /ondc/on_issue
 * Callback for Issue Status Updates
 */
router.post('/on_issue', auditIncomingMiddleware, verifyOndcSignature, async (req, res) => {
    try {
        await igmService.onIssue(req.body);
        res.json({ message: { ack: { status: 'ACK' } } });
    } catch (error) {
        console.error('Error handling on_issue:', error);
        res.status(500).json({ message: { ack: { status: 'NACK' } } });
    }
});

/**
 * POST /ondc/on_receiver_recon
 * Callback for Settlement/Reconciliation
 */
router.post('/on_receiver_recon', auditIncomingMiddleware, verifyOndcSignature, async (req, res) => {
    try {
        await reconService.onReceiverRecon(req.body);
        res.json({ message: { ack: { status: 'ACK' } } });
    } catch (error) {
        console.error('Error handling on_receiver_recon:', error);
        res.status(500).json({ message: { ack: { status: 'NACK' } } });
    }
});

export default router;
