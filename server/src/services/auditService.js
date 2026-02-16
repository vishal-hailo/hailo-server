import AuditLog from '../models/AuditLog.js';

/**
 * Service to handle Audit Logging for ONDC transactions.
 * Logs are written asynchronously to avoid blocking the main thread.
 */
export const auditService = {

    /**
     * log
     * @param {Object} details
     * @param {String} details.transactionId
     * @param {String} details.messageId
     * @param {String} details.action
     * @param {String} details.direction - 'INBOUND' | 'OUTBOUND'
     * @param {Object} details.payload
     * @param {Object} details.headers
     * @param {String} details.status - 'SUCCESS' | 'ERROR' | 'ACK' | 'NACK'
     * @param {Object} details.error
     */
    async log(details) {
        try {

            // Check if context exists in payload (for extraction if not provided)
            const context = details.payload?.context || {};

            const logEntry = new AuditLog({
                transactionId: details.transactionId || context.transaction_id,
                messageId: details.messageId || context.message_id,
                action: details.action || context.action,
                direction: details.direction,
                source: details.source || context.bap_id || context.bpp_id,
                destination: details.destination,
                payload: details.payload,
                headers: details.headers,
                status: details.status,
                error: details.error
            });

            // Fire and forget (don't await) in highly concurrent envs, 
            // but for data integrity usually strictly await or use a queue.
            // Using await here to ensure we don't crash silently on connection issues during Dev.
            await logEntry.save();

        } catch (err) {
            console.error('Failed to write Audit Log:', err.message);
        }
    }
};

