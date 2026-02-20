import axios from 'axios';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { becknAuthService } from '../src/services/becknAuth.js';
import { ONDC_CONFIG } from '../src/config/ondc.js';

dotenv.config();

async function testRegistryAuth() {
    console.log('🕵️‍♂️ Testing Registry Auth (Key Rotation Check)...');

    const registryUrl = 'https://preprod.registry.ondc.org/v2.0/lookup';

    // Try different Key IDs
    const potentialKeyIds = [
        ONDC_CONFIG.KEY_ID, // hailo-key-1
        'hailo-key-2',
        'hailo-key-3',
        'my-key-1',
        'key-1'
    ];

    console.log('Testing with current Private Key and multiple Key IDs:', potentialKeyIds);

    for (const keyId of potentialKeyIds) {
        console.log(`\n🔑 Testing Key ID: ${keyId}`);

        // Temporarily override config
        ONDC_CONFIG.KEY_ID = keyId;

        const payload = {
            subscriber_id: ONDC_CONFIG.SUBSCRIBER_ID,
            domain: ONDC_CONFIG.DOMAIN,
            type: 'BAP',
            country: ONDC_CONFIG.COUNTRY_CODE,
            city: ONDC_CONFIG.CITY_CODE
        };

        try {
            const authHeader = await becknAuthService.createAuthorizationHeader(payload);

            const response = await axios.post(registryUrl, payload, {
                headers: {
                    'Authorization': authHeader,
                    'Content-Type': 'application/json'
                }
            });

            console.log(`✅ SUCCESS with Key ID: ${keyId}!`);
            console.log('Update your .env with this Key ID.');
            return; // Exit on success

        } catch (error) {
            if (error.response && error.response.status === 401) {
                console.log(`❌ Failed (401) with Key ID: ${keyId}`);
            } else {
                console.error(`⚠️ Error with Key ID: ${keyId} - ${error.message}`);
                if (error.response) console.log(JSON.stringify(error.response.data));
            }
        }
    }
    console.log('\n❌ All Key IDs failed. The Private Key might not match ANY registered key.');
}

testRegistryAuth();
