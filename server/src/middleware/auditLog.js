import { auditService } from '../services/auditService.js';

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
        const status = body?.message?.ack?.status || 'UNKNOWN';

        // Log the completion (optional, or update previous log)
        // For simplicity in this MVP, we might just log the request. 
        // But verifying ACK is good.

        auditService.log({
            transactionId,
            messageId, // Response usually references same messageId or a new one? Context should match.
            action,
            direction: 'OUTBOUND', // This is the RESPONSE to the inbound request. valid? 
            // Actually, Audit Logs usually track "Transactions" or "API Calls".
            // Let's keep it simple: Log the Request Receipt.
            // If we want to log the response sent back, we can.

            // Let's just log if it was an ERROR/NACK.
            status: status === 'NACK' ? 'ERROR' : 'SUCCESS',
            error: status === 'NACK' ? body.error : undefined,
            source: process.env.ONDC_SUBSCRIBER_ID,
            destination: context.bap_id || context.bpp_id
        });

        return originalJson.call(this, body);
    };

    next();
};
