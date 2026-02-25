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
            action: 'search',
            bap_id: ONDC_CONFIG.SUBSCRIBER_ID,
            bap_uri: ONDC_CONFIG.SUBSCRIBER_URL,
            location: {
                city: { code: 'std:080' },
                country: { code: 'IND' }
            },
            message_id: uuidv4(),
            timestamp: new Date().toISOString(),
            transaction_id: transactionId,
            ttl: 'PT30S',
            version: '2.0.1'
        },
        message: {
            intent: {
                fulfillment: {
                    stops: [
                        {
                            location: { gps: "12.971599, 77.594563" },
                            type: "START"
                        },
                        {
                            location: { gps: "12.924158, 77.622521" },
                            type: "END"
                        }
                    ]
                },
                payment: {
                    collected_by: "BPP",
                    tags: [
                        {
                            descriptor: { code: "BUYER_FINDER_FEES" },
                            display: false,
                            list: [
                                { descriptor: { code: "BUYER_FINDER_FEES_PERCENTAGE" }, value: "1" }
                            ]
                        },
                        {
                            descriptor: { code: "SETTLEMENT_TERMS" },
                            display: false,
                            list: [
                                { descriptor: { code: "DELAY_INTEREST" }, value: "5" },
                                { descriptor: { code: "STATIC_TERMS" }, value: "https://api.hailone.in/terms.txt" }
                            ]
                        }
                    ]
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
