import _sodium from 'libsodium-wrappers';
import blake from 'blakejs';
import { ONDC_CONFIG } from '../config/ondc.js';
import { ondcRegistryService } from './ondcRegistryService.js';

/**
 * Beckn Authentication Service
 * Implements ONDC-compliant Request Signing (Ed25519) and Verification.
 * Reference: https://github.com/beckn/protocol-specifications/tree/master/api/transaction/auth
 */
class BecknAuthService {
    constructor() {
        this.sodium = null;
        this.ready = this.init();
    }

    async init() {
        await _sodium.ready;
        this.sodium = _sodium;
    }

    /**
     * Creates the 'Authorization' header for outgoing requests.
     * Format: Signature keyId="subscriber_id|key_id|ed25519",algorithm="ed25519",created="timestamp",expires="timestamp",headers="(created) (expires) digest",signature="base64_signature"
     */
    async createAuthorizationHeader(body) {
        await this.ready;

        const created = Math.floor(Date.now() / 1000);
        const expires = created + 10; // 10 seconds validity usually sufficient for network latency

        // 1. Create Digest of the body
        // blake2b 512 bit hash, base64 encoded
        const digest = this.sodium.to_base64(
            blake.blake2b(JSON.stringify(body), null, 64),
            this.sodium.base64_variants.ORIGINAL
        );

        // 2. Create Signing String
        // (created): {created}
        // (expires): {expires}
        // digest: BLAKE-512={digest}
        const signingString = `(created): ${created}\n(expires): ${expires}\ndigest: BLAKE-512=${digest}`;

        // 3. Sign the string using Private Key
        const privateKeyBytes = this.sodium.from_base64(ONDC_CONFIG.PRIVATE_KEY, this.sodium.base64_variants.ORIGINAL);
        const signature = this.sodium.to_base64(
            this.sodium.crypto_sign_detached(signingString, privateKeyBytes),
            this.sodium.base64_variants.ORIGINAL
        );

        // 4. Construct Header
        const keyId = `${ONDC_CONFIG.SUBSCRIBER_ID}|${ONDC_CONFIG.KEY_ID}|ed25519`;
        return `Signature keyId="${keyId}",algorithm="ed25519",created="${created}",expires="${expires}",headers="(created) (expires) digest",signature="${signature}"`;
    }

    /**
     * Verifies the 'Authorization' header of incoming requests.
     */
    async verifySignature(header, body) {
        await this.ready;

        if (!header || !header.startsWith("Signature ")) {
            throw new Error("Missing or invalid Authorization header format");
        }

        const params = this.parseHeader(header);

        // 1. Check timestamp validity
        const now = Math.floor(Date.now() / 1000);
        if (parseInt(params.expires) < now) {
            throw new Error("Signature expired");
        }
        // Also check if 'created' is too far in the past/future if needed, but 'expires' covers valid window

        // 2. Fetch Public Key
        // keyId format: "subscriber_id|key_id|algo"
        const [subscriberId, keyId, algo] = params.keyId.split('|');
        if (algo !== 'ed25519') throw new Error("Unsupported algorithm");

        // Use Registry Lookup (or cached keys)
        // For MOCK/DEV modes, we might skip registry lookup if needed, but Production Core must use it.
        // We will assume a registry lookup is required.
        let publicKeyBase64 = await ondcRegistryService.lookupPublicKey(subscriberId, keyId);

        // FALLBACK FOR TESTING: If mock, allow Verification if we are talking to ourselves or known mock
        if (!publicKeyBase64 && process.env.ONDC_MOCK === 'true') {
            // In mock mode, if we can't find key, maybe we just accept it OR use our own public key if it's a self-test
            console.warn("⚠️ MOCK MODE: Public key not found, using own key for verification test");
            publicKeyBase64 = ONDC_CONFIG.PUBLIC_KEY;
        }

        if (!publicKeyBase64) {
            throw new Error(`Public Key not found for subscriber: ${subscriberId}`);
        }

        // 3. Reconstruct Signing String
        const digest = this.sodium.to_base64(
            blake.blake2b(JSON.stringify(body), null, 64),
            this.sodium.base64_variants.ORIGINAL
        );
        const signingString = `(created): ${params.created}\n(expires): ${params.expires}\ndigest: BLAKE-512=${digest}`;

        // 4. Verify Signature
        const publicKeyBytes = this.sodium.from_base64(publicKeyBase64, this.sodium.base64_variants.ORIGINAL);
        const signatureBytes = this.sodium.from_base64(params.signature, this.sodium.base64_variants.ORIGINAL);

        const isValid = this.sodium.crypto_sign_verify_detached(
            signatureBytes,
            signingString,
            publicKeyBytes
        );

        if (!isValid) {
            throw new Error("Signature verification failed");
        }

        return true;
    }

    parseHeader(header) {
        const parts = header.replace('Signature ', '').split(',');
        const params = {};
        parts.forEach(part => {
            const [key, value] = part.split('=');
            if (key && value) {
                params[key.trim()] = value.replace(/"/g, ''); // Remove quotes
            }
        });
        return params;
    }
}

export const becknAuthService = new BecknAuthService();
