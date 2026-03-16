import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { becknAuthService } from '../src/services/becknAuth.js';
import { ONDC_CONFIG } from '../src/config/config.js';
import Transaction from '../src/models/Transaction.js';

dotenv.config();

async function testIntegrationDualPing() {
    console.log('🚀 Starting ONDC Live Integration Test (Dual-Ping Bypass)...');
    console.log('---------------------------------------');

    // Step 1: Tell Render to register the search in its DB
    console.log(`1️⃣ Ping Live Backend to Register Transaction...`);
    const backendUrl = 'https://api.hailone.in/ondc/search';
    const initPayload = {
        latitude: 12.971599, longitude: 77.594563,
        destination: { latitude: 12.924158, longitude: 77.622521 }
    };

    let transactionId;
    try {
        const res = await axios.post(backendUrl, initPayload, { headers: { 'Content-Type': 'application/json' } });
        transactionId = res.data.transactionId;
        console.log(`✅ Success. Render created Transaction ID: ${transactionId}`);
        console.log(`(Render will uselessly broadcast to Staging, we will ignore that)`);
    } catch (e) {
        console.error('❌ Failed to ping backend:', e.message); return;
    }

    // Step 2: Push the transaction directly to Preprod Gateway
    console.log(`\n2️⃣ Broadcasting Payload natively to Preprod Gateway...`);
    const gatewayUrl = 'https://preprod.gateway.ondc.org/search';
    const messageId = uuidv4();

    const payload = {
        context: {
            domain: ONDC_CONFIG.DOMAIN,
            action: 'search',
            bap_id: 'api.hailone.in',
            bap_uri: 'https://api.hailone.in/ondc',
            location: {
                city: { code: 'std:080' },
                country: { code: 'IND' }
            },
            message_id: messageId,
            timestamp: new Date().toISOString(),
            transaction_id: transactionId,
            ttl: 'PT30S',
            version: '2.0.1'
        },
        message: {
            intent: {
                fulfillment: {
                    stops: [
                        { location: { gps: "12.971599, 77.594563" }, type: "START" },
                        { location: { gps: "12.924158, 77.622521" }, type: "END" }
                    ]
                },
                payment: {
                    collected_by: "BPP",
                    tags: [
                        {
                            descriptor: { code: "BUYER_FINDER_FEES" },
                            display: false,
                            list: [{ descriptor: { code: "BUYER_FINDER_FEES_PERCENTAGE" }, value: "1" }]
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

        console.log(`📡 Sending directly to ${gatewayUrl}...`);
        const response = await axios.post(gatewayUrl, payload, {
            headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' }
        });

        console.log(`✅ SUCCESS! Received ${response.status}`);
        if (response.data.message?.ack?.status === 'ACK') {
            console.log('🎉 ACK RECEIVED. The Preprod Gateway accepted the request.');
            console.log(`🆔 Transaction ID: ${transactionId}`);
            console.log('👉 Verify on the Pramaan Dashboard!!');
            console.log('👉 Important: Wait 5 seconds for the mock seller to reply to the Render sever via webhook before running the select script.');
        } else {
            console.warn('⚠️ Request Accepted but NACK received.');
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

testIntegrationDualPing();
