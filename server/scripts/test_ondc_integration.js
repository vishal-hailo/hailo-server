import axios from 'axios';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { becknAuthService } from '../src/services/becknAuth.js';
import { ONDC_CONFIG } from '../src/config/ondc.js';

dotenv.config();

async function testIntegration() {
    console.log('🚀 Starting ONDC Live Integration Test...');
    console.log('---------------------------------------');
    const gatewayUrl = process.env.ONDC_GATEWAY_URL;
    console.log('Target Gateway:', gatewayUrl);

    if (!gatewayUrl) {
        console.error('❌ ONDC_GATEWAY_URL is missing in .env');
        return;
    }

    // specific location in Mumbai
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
            transaction_id: transactionId,
            message_id: uuidv4(),
            timestamp: new Date().toISOString(),
            ttl: 'PT30S',
        },
        message: {
            intent: {
                fulfillment: {
                    start: {
                        location: {
                            gps: "19.0760,72.8777"
                        }
                    },
                    end: {
                        location: {
                            gps: "19.0544,72.8406"
                        }
                    }
                }
            }
        }
    };

    try {
        console.log('📝 Generating Authorization Header...');
        const authHeader = await becknAuthService.createAuthorizationHeader(payload);
        console.log('🔑 Auth header generated.');

        console.log(`📡 Sending Request to ${gatewayUrl}...`);
        const startTime = Date.now();

        const response = await axios.post(gatewayUrl, payload, {
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json'
            }
        });

        const duration = Date.now() - startTime;
        console.log(`✅ SUCCESS! Received ${response.status} in ${duration}ms`);
        console.log('---------------------------------------');
        console.log('Response Data:', JSON.stringify(response.data, null, 2));
        console.log('---------------------------------------');

        if (response.data.message?.ack?.status === 'ACK') {
            console.log('🎉 ACK RECEIVED. The Gateway accepted the request.');
            console.log(`🆔 Transaction ID: ${transactionId}`);
            console.log('👉 Check Pramaan Dashboard for this ID.');
        } else {
            console.warn('⚠️ Request Accepted but NACK received (Application Error).');
        }

    } catch (error) {
        console.error('❌ REQUEST FAILED');
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
    }
}

testIntegration();
