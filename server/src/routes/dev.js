import express from 'express';
import AuditLog from '../models/AuditLog.js';

const router = express.Router();

/**
 * GET /api/dev/export-logs
 * Exports logs for a given transaction ID in ONDC LVU format.
 */
router.get('/export-logs', async (req, res) => {
    try {
        const { txnId } = req.query;
        if (!txnId) return res.status(400).json({ error: 'Missing txnId query parameter' });

        // 1. Fetch Logs
        const logs = await AuditLog.find({ transactionId: txnId }).sort({ timestamp: 1 }).lean();

        if (logs.length === 0) return res.status(404).json({ error: 'No logs found for this Transaction ID' });

        // 2. Format Logs (Extract payload only, ensure header presence if needed)
        // ONDC LVU usually expects an array of the raw request/response objects OR just the payloads.
        // Task description says: "Full Request/Response pairs (including headers)".
        // We stored them as 'payload' and 'headers'. 
        // We will structure it as an array of objects representing the calls.

        const formattedLogs = logs.map(log => {
            // Basic structure check
            const payload = log.payload || {};

            // Pre-flight Checks
            const context = payload.context || {};
            const validations = {
                hasCoreVersion: context.core_version === '2.0.1' || context.core_version === '1.0.0', // IGM is 1.0.0
                hasBapId: context.bap_id === 'api.hailone.in',
                hasCity: context.city === 'std:022'
            };

            return {
                _meta: {
                    action: log.action,
                    direction: log.direction,
                    timestamp: log.timestamp,
                    validations
                },
                request: {
                    url: log.destination === 'GATEWAY' ? 'https://staging.gateway.ondc.org/search' : (log.destination || 'UNKNOWN'),
                    method: 'POST',
                    headers: log.headers,
                    body: payload
                },
                // In a real proxy, we'd capture the RESPONSE body too.
                // Here we only audited the Request usually. 
                // For "Happy Path", we show the OUTBOUND requests we sent and INBOUND callbacks we received.
                // The INBOUND callbacks act as the "Response" from the network in async flows.
            };
        });

        res.json(formattedLogs);

    } catch (error) {
        console.error('Export Log Error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
