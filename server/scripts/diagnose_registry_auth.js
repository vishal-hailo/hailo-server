import axios from 'axios';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { becknAuthService } from '../src/services/becknAuth.js';
import { ONDC_CONFIG } from '../src/config/ondc.js';

dotenv.config();

async function testRegistryAuth() {
    console.log('🕵️‍♂️ Testing Registry Auth (Self-Lookup)...');

    // The Registry URL - SWITCHING BACK TO PREPROD
    const registryUrl = 'https://preprod.registry.ondc.org/v2.0/lookup';

    // Valid Lookup Payload structure for v2.0
    // Note: Requesting info about OURSELVES
    const payload = {
        subscriber_id: ONDC_CONFIG.SUBSCRIBER_ID,
        domain: ONDC_CONFIG.DOMAIN,
        type: 'BAP',
        country: ONDC_CONFIG.COUNTRY_CODE,
        city: ONDC_CONFIG.CITY_CODE
    };

    try {
        // We need to sign the request to auth with Registry
        // The signature header format is same as other APIs
        // However, for Registry, sometimes the payload structure is different? 
        // Standard Beckn: Authorization header signs the JSON body.

        const authHeader = await becknAuthService.createAuthorizationHeader(payload);
        console.log('🔑 Generated Auth Header for Registry Lookup');
        console.log(`📡 Sending to ${registryUrl}...`);

        const response = await axios.post(registryUrl, payload, {
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ REGISTRY LOOKUP SUCCESS!');
        console.log('Response:', JSON.stringify(response.data, null, 2));

        // Check if we are in the list
        if (Array.isArray(response.data)) {
            const myEntry = response.data.find(e => e.subscriber_id === ONDC_CONFIG.SUBSCRIBER_ID);
            if (myEntry) {
                console.log('Found My Entry:');
                console.log(`   - Status: ${myEntry.status}`);
                console.log(`   - Key ID: ${myEntry.ukId || myEntry.unique_key_id}`);
                console.log(`   - Public Key: ${myEntry.signing_public_key}`);
                console.log(`   - Local Key:  ${ONDC_CONFIG.PUBLIC_KEY}`);

                if (myEntry.signing_public_key === ONDC_CONFIG.PUBLIC_KEY) {
                    console.log('🎉 KEYS MATCH! The issue is likely the Gateway URL or Cache.');
                } else {
                    console.error('❌ KEYS MISMATCH! You need to update your .env with the Registry Key, or Rotate Keys.');
                }
            } else {
                console.warn('⚠️ Lookup success but returned empty list or I am not in it?');
            }
        }

    } catch (error) {
        console.error('❌ REGISTRY AUTH FAILED');
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
            if (error.response.status === 401) {
                console.error('👉 This means your LOCAL KEYS do not match the keys registered for this Subscriber ID.');
            }
        } else {
            console.error('Error:', error.message);
        }
    }
}

testRegistryAuth();
