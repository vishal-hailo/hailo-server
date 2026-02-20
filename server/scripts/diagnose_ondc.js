import axios from 'axios';
import dotenv from 'dotenv';
import { ONDC_CONFIG } from '../src/config/ondc.js';

dotenv.config();

const PREPROD_REGISTRY = 'https://preprod.registry.ondc.org/lookup';
const STAGING_REGISTRY = 'https://staging.registry.ondc.org/lookup';

async function diagnose() {
    console.log('🕵️‍♂️ Starting ONDC Diagnostics...');
    console.log('--------------------------------');
    console.log('Current Config:');
    console.log(`Subscriber ID: ${process.env.ONDC_SUBSCRIBER_ID}`);
    console.log(`Gateway URL: ${process.env.ONDC_GATEWAY_URL}`);
    console.log(`Registry URL (Env): ${process.env.ONDC_REGISTRY_URL}`);
    console.log('--------------------------------');

    await checkRegistry('PREPROD', PREPROD_REGISTRY);
    await checkRegistry('STAGING', STAGING_REGISTRY);
}

async function checkRegistry(name, url) {
    console.log(`\nTesting Lookup on ${name} Registry (${url})...`);
    try {
        const response = await axios.post(url, {
            subscriber_id: process.env.ONDC_SUBSCRIBER_ID,
            domain: 'ONDC:TRV10',
            country: 'IND',
            city: 'std:022',
            type: 'BAP' // We are a Buyer App
        });

        if (response.data && Array.isArray(response.data) && response.data.length > 0) {
            console.log(`✅ FOUND in ${name} Registry!`);
            const entry = response.data[0];
            console.log(`   - Status: ${entry.status}`);
            console.log(`   - Key ID: ${entry.ukId || entry.unique_key_id}`);
            console.log(`   - Signing Public Key: ${entry.signing_public_key}`);

            // Validate Key
            if (process.env.ONDC_PUBLIC_KEY === entry.signing_public_key) {
                console.log('   - ✅ Public Key Matches Local Config');
            } else {
                console.log('   - ❌ Public Key THIS DOES NOT MATCH Local Config!');
                console.log(`     Local:  ${process.env.ONDC_PUBLIC_KEY}`);
                console.log(`     Remote: ${entry.signing_public_key}`);
            }
        } else {
            console.log(`❌ NOT FOUND in ${name} Registry.`);
        }
    } catch (error) {
        console.error(`⚠️ Request Failed to ${name}:`, error.message);
    }
}

diagnose();
