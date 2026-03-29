import { auditService } from '../services/auditService.js';
import { ONDC_CONFIG } from '../config/config.js';

/**
 * Middleware to log incoming ONDC requests.
 * Should be placed AFTER body parsing but BEFORE auth/processing.
 */
export const auditIncomingMiddleware = async (req, res, next) => {
    // Capture the original 'end' function to intercept response status/error
    const originalEnd = res.end;
    const startTime = Date.now();

    // Log the incoming request immediately
    const context = req.body?.context || {};
    const transactionId = context.transaction_id;
    const messageId = context.message_id;
    const action = context.action || req.path.split('/').pop(); // fallback to path

    // We can't log status yet, but we log reception
    // We'll update the log or create a new entry for response in a real robust system.
    // For now, let's log the "INBOUND REQUEST"

    // Fire and forget
    auditService.log({
        transactionId,
        messageId,
        action,
        direction: 'INBOUND',
        source: context.bap_id || context.bpp_id || 'UNKNOWN_NETWORK_PARTICIPANT',
        destination: process.env.ONDC_SUBSCRIBER_ID,
        payload: req.body,
        headers: req.headers,
        status: 'PROCESSING' // Initial status
    });

    // Override end to log the response (ACK/NACK)
    // precise logging of response body might require overriding res.write/json
    // For ONDC, usually we just return { message: { ack: ... } }

    const originalJson = res.json;
    res.json = function (body) {
        try {
            const status = body?.message?.ack?.status || 'UNKNOWN';

            auditService.log({
                transactionId,
                messageId,
                action,
                direction: 'OUTBOUND',
                status: status === 'NACK' ? 'ERROR' : 'SUCCESS',
                error: status === 'NACK' ? body.error : undefined,
                source: process.env.ONDC_SUBSCRIBER_ID || ONDC_CONFIG.SUBSCRIBER_ID,
                destination: context.bap_id || context.bpp_id
            });
        } catch (err) {
            console.error('Audit Middleware Response Logging Failed:', err.message);
        }

        return originalJson.call(this, body);
    };

    next();
};
