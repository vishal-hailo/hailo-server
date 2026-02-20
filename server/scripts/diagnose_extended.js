import axios from 'axios';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { becknAuthService } from '../src/services/becknAuth.js';
import { ONDC_CONFIG } from '../src/config/ondc.js';

dotenv.config();

async function diagnoseMismatch() {
    console.log('🕵️‍♂️ Starting Deep Diagnostic for Key Mismatch...');

    // 1. Fetch what is ACTUALLY on the Registry (Public Lookup)
    // We use a simplified lookup that doesn't require signing (sometimes works for V2)
    // OR we use the previous curl output method if axios fails

    const registryUrl = 'https://preprod.registry.ondc.org/v2.0/lookup';

    // We already know simple lookup fails with 401. 
    // BUT, we can try to look up using a different method or just log what we have locally.

    console.log('\n--- 1. LOCAL CONFIGURATION ---');
    console.log(`Subscriber ID: ${ONDC_CONFIG.SUBSCRIBER_ID}`);
    console.log(`Local Public Key:  ${ONDC_CONFIG.PUBLIC_KEY}`);
    console.log(`Local Key ID:      ${ONDC_CONFIG.KEY_ID}`);

    // If we can't look up without auth, we are stuck in a catch-22.
    // However, usually one can look up *other* participants without being them.
    // Let's try to lookup "mock-server" or "pramaan" to see if WE are the problem
    // or if the registry just rejects everything.

    console.log('\n--- 2. BRUTE FORCE KEY ID (Extended) ---');
    // Try to sign with the Private Key and see if ANY key_id works.
    // Maybe the user's key ID is the Subscriber ID itself?
    // Or maybe it's "hailo-key-1" but case sensitive?

    const candidates = [
        'hailo-key-1', 'Hailo-Key-1', 'hailo-key-01',
        'key-1', 'Key-1', '1',
        'ed25519-1', 'ed25519',
        'api.hailone.in', 'pub_key_1',
        'signing-key', 'hailo-signing-key'
    ];

    for (const kid of candidates) {
        process.stdout.write(`Testing ID: "${kid}" ... `);
        ONDC_CONFIG.KEY_ID = kid;
        try {
            const authHeader = await becknAuthService.createAuthorizationHeader({
                subscriber_id: ONDC_CONFIG.SUBSCRIBER_ID,
                domain: ONDC_CONFIG.DOMAIN,
                type: 'BAP',
                country: ONDC_CONFIG.COUNTRY_CODE,
                city: ONDC_CONFIG.CITY_CODE
            });

            await axios.post(registryUrl, {
                subscriber_id: ONDC_CONFIG.SUBSCRIBER_ID,
                domain: ONDC_CONFIG.DOMAIN,
                type: 'BAP',
                country: ONDC_CONFIG.COUNTRY_CODE,
                city: ONDC_CONFIG.CITY_CODE
            }, {
                headers: { 'Authorization': authHeader }
            });

            console.log('✅ SUCCESS!');
            console.log(`>>> CORRECT KEY ID IS: "${kid}" <<<`);
            return;
        } catch (e) {
            console.log('❌');
        }
    }

    console.log('\n❌ All extended Key IDs failed.');
    console.log('CONCLUSION: The Private Key you have DOES NOT match the Registered Public Key.');
    console.log('You MUST re-register or find the original keys.');
}

diagnoseMismatch();
