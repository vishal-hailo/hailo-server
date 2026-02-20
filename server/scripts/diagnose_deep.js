import axios from 'axios';
import dotenv from 'dotenv';
import { becknAuthService } from '../src/services/becknAuth.js';
import { ONDC_CONFIG } from '../src/config/ondc.js';

dotenv.config();

async function deepDiagnose() {
    console.log('🕵️‍♂️ Deep Diagnostic Phase 2 (Public Key Match)...');
    console.log('Target Key ID:', ONDC_CONFIG.KEY_ID);
    console.log('Local Public Key:', ONDC_CONFIG.PUBLIC_KEY);

    // 1. Fetch the actual entry from Registry
    const registryUrl = 'https://preprod.registry.ondc.org/v2.0/lookup';

    try {
        const dummyPayload = { test: "data" };
        const header = await becknAuthService.createAuthorizationHeader(dummyPayload);
        console.log('\n✅ Local Signature Generation Works');
        console.log('Header:', header);

        // --- KEY PAIR VALIDATION ---
        await becknAuthService.ready;
        const sodium = becknAuthService.sodium;
        const privateKeyBytes = sodium.from_base64(ONDC_CONFIG.PRIVATE_KEY, sodium.base64_variants.ORIGINAL);

        try {
            // Manual Verification: Ed25519 sk is 64 bytes: 32 bytes seed + 32 bytes pk.
            if (privateKeyBytes.length === 64) {
                const pkFromSkBytes = privateKeyBytes.slice(32, 64);
                const pkFromSk = sodium.to_base64(pkFromSkBytes, sodium.base64_variants.ORIGINAL);

                console.log('\n🔐 KEY PAIR CHECK (Manual Slice):');
                console.log(`Config Public Key:  ${ONDC_CONFIG.PUBLIC_KEY}`);
                console.log(`Derived Public Key: ${pkFromSk}`);

                if (pkFromSk !== ONDC_CONFIG.PUBLIC_KEY) {
                    console.error('❌ FATAL: Private Key does NOT match Public Key in .env!');
                    console.error('The Private Key is for a DIFFERENT Public Key.');
                    return;
                } else {
                    console.log('✅ Key Pair is Internally Consistent.');
                }
            } else {
                console.warn(`⚠️ Private Key length is ${privateKeyBytes.length} bytes (expected 64). Cannot verify manually.`);
                // If 32 bytes, it might be just the seed.
            }

        } catch (e) {
            console.error('❌ Key Derivation Failed:', e.message);
        }
        // ---------------------------

        console.log('\n🚀 Attempting Registry Lookup with NEW Key ID...');
        const payload = {
            subscriber_id: ONDC_CONFIG.SUBSCRIBER_ID,
            domain: ONDC_CONFIG.DOMAIN,
            type: 'BAP',
            country: ONDC_CONFIG.COUNTRY_CODE,
            city: ONDC_CONFIG.CITY_CODE
        };

        // CRITICAL FIX: Stringify ONCE to ensure the signed content == sent content
        const payloadString = JSON.stringify(payload);

        const authHeader = await becknAuthService.createAuthorizationHeader(JSON.parse(payloadString));

        const response = await axios.post(registryUrl, payloadString, {
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json'
            }
        });

        console.log('Response:', response.data);

        if (Array.isArray(response.data)) {
            // MATCH USING THE NEW UUID KEY ID
            const entry = response.data.find(e => e.ukId === ONDC_CONFIG.KEY_ID || e.unique_key_id === ONDC_CONFIG.KEY_ID);
            if (entry) {
                console.log('\n--- REGISTRY DATA ---');
                console.log(`Common Name (CN): ${entry.city_code ? entry.city_code : 'N/A'}`);
                console.log(`Registered Public Key: ${entry.signing_public_key}`);
                console.log(`Local Public Key:      ${ONDC_CONFIG.PUBLIC_KEY}`);

                if (entry.signing_public_key === ONDC_CONFIG.PUBLIC_KEY) {
                    console.log('✅ KEYS MATCH! (Wait, then why did auth fail?)');
                } else {
                    console.error('❌ KEYS MISMATCH! The Registry has a DIFFERENT key for this ID.');
                    console.error('This means you regenerated keys BUT did not update the portal correctly, OR you are using an old key file.');
                }
            } else {
                console.warn('⚠️ Entry found but Key ID not found in list?');
                console.log('Entries:', response.data.map(e => e.ukId || e.unique_key_id));
            }
        }

    } catch (error) {
        console.error('❌ Lookup Failed:', error.response ? error.response.data : error.message);
    }
}

deepDiagnose();
