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
        const { transactionId, passengerName, passengerPhone } = req.body;
        if (!transactionId) return res.status(400).json({ error: 'Missing transactionId' });
        const result = await ondcService.init(transactionId, passengerName, passengerPhone);
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

// Trigger ONDC Track (live GPS tracking) - Step 10 in TRV10 Pramaan flow
router.post('/track', async (req, res) => {
    try {
        const { transactionId } = req.body;
        if (!transactionId) return res.status(400).json({ error: 'Missing transactionId' });
        const result = await ondcService.track(transactionId);
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

// Trigger ONDC Rating (Step 12+ in some flows)
router.post('/rating', async (req, res) => {
    try {
        const { transactionId, ratingValue } = req.body;
        if (!transactionId || !ratingValue) return res.status(400).json({ error: 'Missing transactionId or ratingValue' });
        const result = await ondcService.rating(transactionId, ratingValue);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Trigger ONDC Update (Flow 6 Soft Cancellation)
router.post('/update', async (req, res) => {
    try {
        const { transactionId, updateDetails } = req.body;
        if (!transactionId) return res.status(400).json({ error: 'Missing transactionId' });
        const result = await ondcService.update(transactionId, updateDetails);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET Results for a transaction
router.get('/results/:transactionId', async (req, res) => {
    try {
        const results = await ondcService.getResults(req.params.transactionId);
        res.json({ results });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


// Middleware to verify ONDC signatures on incoming callbacks
import { verifyOndcSignature, verifyOndcCallbackContext } from '../middleware/ondcAuth.js';
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
router.post('/on_search', auditIncomingMiddleware, verifyOndcCallbackContext('on_search'), verifyOndcSignature, (req, res) => {
    res.json({ message: { ack: { status: 'ACK' } } });
    (async () => {
        try {
            await ondcService.onSearch(req.body);
        } catch (error) {
            console.error('Asynchronous Error handling on_search:', error);
        }
    })();
});

/**
 * POST /ondc/on_select
 * Callback with detailed quote.
 */
router.post('/on_select', auditIncomingMiddleware, verifyOndcCallbackContext('on_select'), verifyOndcSignature, (req, res) => {
    res.json({ message: { ack: { status: 'ACK' } } });
    (async () => {
        try {
            await ondcService.onSelect(req.body);
        } catch (error) {
            console.error('Asynchronous Error handling on_select:', error);
        }
    })();
});

/**
 * POST /ondc/on_init
 * Callback with initialization details.
 */
router.post('/on_init', auditIncomingMiddleware, verifyOndcCallbackContext('on_init'), verifyOndcSignature, (req, res) => {
    // 1. Respond ACK immediately to prevent portal timeout
    res.json({ message: { ack: { status: 'ACK' } } });

    // 2. Process asynchronously
    (async () => {
        try {
            await ondcService.onInit(req.body);
        } catch (error) {
            console.error('Asynchronous Error handling on_init:', error);
        }
    })();
});

/**
 * POST /ondc/on_confirm
 * Callback with confirmation details.
 */
router.post('/on_confirm', auditIncomingMiddleware, verifyOndcCallbackContext('on_confirm'), verifyOndcSignature, (req, res) => {
    res.json({ message: { ack: { status: 'ACK' } } });
    (async () => {
        try {
            await ondcService.onConfirm(req.body);
        } catch (error) {
            console.error('Asynchronous Error handling on_confirm:', error);
        }
    })();
});

/**
 * POST /ondc/on_cancel
 * Callback for Cancellation
 */
router.post('/on_cancel', auditIncomingMiddleware, verifyOndcCallbackContext('on_cancel'), verifyOndcSignature, (req, res) => {
    res.json({ message: { ack: { status: 'ACK' } } });
    (async () => {
        try {
            await ondcService.onCancel(req.body);
        } catch (error) {
            console.error('Asynchronous Error handling on_cancel:', error);
        }
    })();
});

/**
 * POST /ondc/on_track
 * Callback for GPS Tracking - Step 11 in TRV10 Pramaan flow
 */
router.post('/on_track', auditIncomingMiddleware, verifyOndcCallbackContext('on_track'), verifyOndcSignature, (req, res) => {
    res.json({ message: { ack: { status: 'ACK' } } });
    (async () => {
        try {
            await ondcService.onTrack(req.body);
        } catch (error) {
            console.error('Asynchronous Error handling on_track:', error);
        }
    })();
});

/**
 * POST /ondc/on_status
 * Callback for Order Status Updates
 */
router.post('/on_status', auditIncomingMiddleware, verifyOndcCallbackContext('on_status'), verifyOndcSignature, (req, res) => {
    console.log(`📩 Received on_status for transaction: ${req.body?.context?.transaction_id || 'unknown'}`);
    res.json({ message: { ack: { status: 'ACK' } } });
    (async () => {
        try {
            await ondcService.onStatus(req.body);
        } catch (error) {
            console.error('Asynchronous Error handling on_status:', error);
        }
    })();
});

/**
 * POST /ondc/on_issue
 * Callback for Issue Status Updates
 */
router.post('/on_issue', auditIncomingMiddleware, verifyOndcCallbackContext('on_issue'), verifyOndcSignature, (req, res) => {
    res.json({ message: { ack: { status: 'ACK' } } });
    (async () => {
        try {
            await igmService.onIssue(req.body);
        } catch (error) {
            console.error('Asynchronous Error handling on_issue:', error);
        }
    })();
});

/**
 * POST /ondc/on_receiver_recon
 * Callback for Settlement/Reconciliation
 */
router.post('/on_receiver_recon', auditIncomingMiddleware, verifyOndcCallbackContext('on_receiver_recon'), verifyOndcSignature, (req, res) => {
    res.json({ message: { ack: { status: 'ACK' } } });
    (async () => {
        try {
            await reconService.onReceiverRecon(req.body);
        } catch (error) {
            console.error('Asynchronous Error handling on_receiver_recon:', error);
        }
    })();
});

/**
 * POST /ondc/on_rating
 * Callback for Rating ACK
 */
router.post('/on_rating', auditIncomingMiddleware, verifyOndcCallbackContext('on_rating'), verifyOndcSignature, (req, res) => {
    res.json({ message: { ack: { status: 'ACK' } } });
    (async () => {
        try {
            await ondcService.onRating(req.body);
        } catch (error) {
            console.error('Asynchronous Error handling on_rating:', error);
        }
    })();
});

/**
 * POST /ondc/on_update
 * Callback for Order Updates (Soft Cancellation penalty, driver change)
 */
router.post('/on_update', auditIncomingMiddleware, verifyOndcCallbackContext('on_update'), verifyOndcSignature, (req, res) => {
    res.json({ message: { ack: { status: 'ACK' } } });
    (async () => {
        try {
            await ondcService.onUpdate(req.body);
        } catch (error) {
            console.error('Asynchronous Error handling on_update:', error);
        }
    })();
});

export default router;
