import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { becknAuthService } from '../src/services/becknAuth.js';
import { ONDC_CONFIG } from '../src/config/ondc.js';
import dotenv from 'dotenv';
dotenv.config();

async function runSelectTest() {
    console.log('🚀 Starting ONDC Select Test (Dual-Ping Bypass)...');

    const transactionId = process.argv[2];
    if (!transactionId) {
        console.error('❌ Please provide a transactionId as an argument.');
        process.exit(1);
    }

    const backendUrl = 'https://api.hailone.in/ondc';

    try {
        console.log(`🔍 Fetching results for Transaction ID: ${transactionId} from Live Backend...`);
        const resultsResponse = await axios.get(`${backendUrl}/results/${transactionId}`);
        const results = resultsResponse.data.results;

        if (!results || results.length === 0) {
            console.error('❌ No quotes found for this transaction.');
            process.exit(1);
        }

        console.log(`📊 Found ${results.length} quotes.`);

        // Pick the correct Provider (ignore legacy mock OD_101)
        const selectedQuote = results.find(q => q.providerId === 'REF_OD_512_2036') || results[0];

        console.log(`\n👉 Selecting Quote:`);
        console.log(`   Provider ID: ${selectedQuote.providerId}`);
        console.log(`   Item ID: ${selectedQuote.id}`);
        console.log(`   Fulfillment ID: ${selectedQuote.fulfillmentId}`);
        console.log(`   Target BPP: ${selectedQuote.bppUri}`);

        console.log('\n🚀 Initiating Select Request NATIVELY to BPP...');

        const messageId = uuidv4();
        const payload = {
            context: {
                domain: ONDC_CONFIG.DOMAIN,
                action: 'select',
                bap_id: ONDC_CONFIG.SUBSCRIBER_ID,
                bap_uri: ONDC_CONFIG.SUBSCRIBER_URL,
                bpp_id: selectedQuote.bppId,
                bpp_uri: selectedQuote.bppUri,
                location: { city: { code: 'std:080' }, country: { code: 'IND' } },
                message_id: messageId,
                timestamp: new Date().toISOString(),
                transaction_id: transactionId,
                ttl: 'PT120S',
                version: '2.0.1'
            },
            message: {
                order: {
                    provider: { id: selectedQuote.providerId },
                    items: [{ id: selectedQuote.id }]
                }
            }
        };

        const authHeader = await becknAuthService.createAuthorizationHeader(payload);
        const targetUrl = `${selectedQuote.bppUri}/select`;
        console.log(`📡 Sending to: ${targetUrl}`);

        const response = await axios.post(targetUrl, payload, {
            headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' }
        });

        console.log('\n✅ BPP Responded with HTTP', response.status);
        console.log('Response Body:', JSON.stringify(response.data, null, 2));

        if (response.data?.message?.ack?.status === 'NACK') {
            console.error('❌ SEVERE SCHEMA ERROR: BPP REJECTED THE PAYLOAD!');
        } else {
            console.log('\n👉 Check the Pramaan dashboard. If successful, the `select` step should turn green!');

            // Ping backend manually so its UI states get updated
            await axios.post(`${backendUrl}/select`, {
                transactionId, providerId: selectedQuote.providerId, itemId: selectedQuote.id
            }).catch(() => { });
        }

    } catch (error) {
        console.error('\n❌ SELECT TEST FAILED');
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
    }
}

runSelectTest();
