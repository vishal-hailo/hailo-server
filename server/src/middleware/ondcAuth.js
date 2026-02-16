import { becknAuthService } from '../services/becknAuth.js';

/**
 * Middleware to verify ONDC Authorization header.
 * Applies to all webhook callbacks (/ondc/on_*).
 */
export const verifyOndcSignature = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];

        if (!authHeader) {
            console.warn('⚠️ Missing Authorization Header');
            // Un-comment to enforce strictly
            // return res.status(401).json({ message: { ack: { status: 'NACK' } }, error: { code: '30000', message: 'Missing Authorization Header' } });
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

        // Production Mode: Strict Verification
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
