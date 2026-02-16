import crypto from 'crypto';
import { ONDC_CONFIG } from '../config/ondc.js';

export const ondcSignatureService = {
    /**
     * createAuthorizationHeader
     * Generates the Authorization header for ONDC requests.
     * Format: Signature keyId="...",algorithm="ed25519",created="...",expires="...",headers="(created) (expires) digest",signature="..."
     */
    async createAuthorizationHeader(body) {
        if (!ONDC_CONFIG.PRIVATE_KEY) {
            throw new Error('ONDC_PRIVATE_KEY is missing in configuration');
        }

        const created = Math.floor(Date.now() / 1000);
        const expires = created + 30; // 30 seconds validity

        // 1. Calculate Digest
        const digest = this.generateDigest(body);

        // 2. Construct Signing String
        // The strict order is (created) (expires) digest
        const signingString = `(created): ${created}
(expires): ${expires}
digest: BLAKE-512=${digest}`;

        // 3. Sign using Private Key (Ed25519)
        const signature = this.signMessage(signingString, ONDC_CONFIG.PRIVATE_KEY);

        // 4. Construct Header
        const header = `Signature keyId="${ONDC_CONFIG.SUBSCRIBER_ID}|${ONDC_CONFIG.KEY_ID}|ed25519",algorithm="ed25519",created="${created}",expires="${expires}",headers="(created) (expires) digest",signature="${signature}"`;

        return header;
    },

    /**
     * generateDigest
     * Creates a BLAKE-512 hash of the request body
     */
    generateDigest(body) {
        const hash = crypto.createHash('blake2b512');
        hash.update(JSON.stringify(body));
        return hash.digest('base64');
    },

    /**
     * signMessage
     * Signs the string using Ed25519 private key
     */
    signMessage(message, privateKeyBase64) {
        const privateKeyBuffer = Buffer.from(privateKeyBase64, 'base64');

        // Import key for signing
        const keyObject = crypto.createPrivateKey({
            key: privateKeyBuffer,
            format: 'der',
            type: 'pkcs8'
        });

        const signature = crypto.sign(null, Buffer.from(message), keyObject);
        return signature.toString('base64');
    },

    /**
     * verifyHeader
     * Verifies the incoming authorization header from another ONDC participant
     */
    async verifyHeader(header, body, publicKeyBase64) {
        // Note: Parsing existing header logic is complex as it requires
        // lookup of the sender's public key from the registry matches the keyId in header.
        // This is a placeholder for the verification logic.

        // 1. Parse header to get signature, created, expires, keyId
        // 2. Reconstruct signing string
        // 3. Verify signature using provided publicKey

        return true; // TODO: Implement full verification
    }
};
