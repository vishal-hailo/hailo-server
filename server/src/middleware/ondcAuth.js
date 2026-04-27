import { becknAuthService } from '../services/becknAuth.js';
import { ONDC_CONFIG } from '../config/config.js';

/**
 * Middleware to verify ONDC Authorization header.
 * Applies to all webhook callbacks (/ondc/on_*).
 */
export const verifyOndcSignature = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const allowBypass = process.env.ONDC_ALLOW_INSECURE_CALLBACKS === 'true';

        if (!authHeader) {
            if (process.env.ONDC_MOCK === 'true' || allowBypass) {
                console.warn('⚠️ Missing Authorization Header allowed in mock/insecure mode');
                return next();
            }
            return res.status(401).json({
                message: { ack: { status: 'NACK' } },
                error: { code: '30000', message: 'Missing Authorization Header' }
            });
        }

        if (process.env.ONDC_MOCK === 'true') {
            // In mock mode, we might be lenient or the request might come from our own mock script which might not sign correctly yet
            // So we warn but proceed if header is missing, OR verify if present.
            if (authHeader) {
                await becknAuthService.verifySignature(authHeader, req.body);
                console.log('✅ Signature Verification Successful');
            }
            return next();
        }

        // Explicit insecure mode is required for bypassing signatures in non-mock environments.
        // This prevents accidental production bypass for domains containing "mock"/"pramaan".
        if (allowBypass) {
            console.warn('⚠️ ONDC_ALLOW_INSECURE_CALLBACKS=true, skipping signature verification');
            return next();
        }

        await becknAuthService.verifySignature(authHeader, req.body);
        next();

    } catch (error) {
        console.error('❌ Signature Verification Failed:', error.message);
        return res.status(401).json({
            message: { ack: { status: 'NACK' } },
            error: { code: '30000', message: 'Invalid Signature', path: error.message }
        });
    }
};

export const verifyOndcCallbackContext = (expectedAction) => (req, res, next) => {
    const context = req.body?.context || {};
    const { action, transaction_id, message_id, domain } = context;

    if (!action || !transaction_id || !message_id) {
        return res.status(400).json({
            message: { ack: { status: 'NACK' } },
            error: { code: '30000', message: 'Invalid callback context: action, transaction_id, message_id are required' }
        });
    }

    if (expectedAction && action !== expectedAction) {
        return res.status(400).json({
            message: { ack: { status: 'NACK' } },
            error: { code: '30000', message: `Invalid callback action: expected ${expectedAction}, got ${action}` }
        });
    }

    if (domain && ONDC_CONFIG.DOMAIN && domain !== ONDC_CONFIG.DOMAIN) {
        return res.status(400).json({
            message: { ack: { status: 'NACK' } },
            error: { code: '30000', message: `Invalid callback domain: expected ${ONDC_CONFIG.DOMAIN}, got ${domain}` }
        });
    }

    next();
};
