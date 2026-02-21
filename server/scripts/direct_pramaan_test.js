import axios from 'axios';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { becknAuthService } from '../src/services/becknAuth.js';
import { ONDC_CONFIG } from '../src/config/ondc.js';

dotenv.config();

async function directTest() {
    // The specific mock server from the user's screenshot
    const pramaanMockUrl = 'https://pramaan.ondc.org/beta/preprod/mock/search';
    const transactionId = uuidv4();
    
    const payload = {
        context: {
            domain: ONDC_CONFIG.DOMAIN,
            country: ONDC_CONFIG.COUNTRY_CODE,
            city: ONDC_CONFIG.CITY_CODE,
            action: 'search',
            core_version: '2.0.1',
            bap_id: ONDC_CONFIG.SUBSCRIBER_ID,
            bap_uri: ONDC_CONFIG.SUBSCRIBER_URL,
            bpp_id: 'pramaan.ondc.org/beta/preprod/mock',
            bpp_uri: 'https://pramaan.ondc.org/beta/preprod/mock',
            transaction_id: transactionId,
            message_id: uuidv4(),
            timestamp: new Date().toISOString(),
            ttl: 'PT30S',
        },
        message: {
            intent: {
                fulfillment: {
                    vehicle: { category: "ANY" },
                    start: { location: { gps: "19.0760,72.8777" } },
                    end: { location: { gps: "19.0544,72.8406" } }
                },
                payment: {
                    "@ondc/org/buyer_app_finder_fee_type": "percent",
                    "@ondc/org/buyer_app_finder_fee_amount": "3"
                },
                tags: [
                    {
                        descriptor: { code: "bap_terms" },
                        list: [
                            { descriptor: { code: "finder_fee_type" }, value: "percent" },
                            { descriptor: { code: "finder_fee_amount" }, value: "3" }
                        ]
                    },
                    {
                        descriptor: { code: "bap_id" },
                        list: [ { descriptor: { code: "bap_id" }, value: ONDC_CONFIG.SUBSCRIBER_ID } ]
                    }
                ]
            }
        }
    };

    try {
        const authHeader = await becknAuthService.createAuthorizationHeader(payload);
        console.log(`📡 Hitting Pramaan Directly: ${pramaanMockUrl}`);
        const response = await axios.post(pramaanMockUrl, payload, {
            headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' }
        });
        console.log(`✅ SUCCESS! HTTP ${response.status}`);
        console.log(`🆔 Transaction ID: ${transactionId}`);
        console.log('Response:', response.data);
    } catch (e) {
        console.error('❌ FAILED HTTP', e.response?.status);
        if (e.response?.status === 404) console.log("404 means Pramaan does not accept direct /search hits.");
    }
}
directTest();
