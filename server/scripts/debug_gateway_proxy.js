import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Transaction from '../src/models/Transaction.js';
import { becknAuthService } from '../src/services/becknAuth.js';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hailo');
    try {
        console.log('Connected to DB. Starting Proxy Select via Gateway...');
        const t = await Transaction.findOne({ transactionId: '844103e2-e6bd-4826-8095-ca8d7fb387b1' });
        const item = t.results[0];
        const messageId = uuidv4();

        const payload = {
            context: {
                domain: 'ONDC:TRV10', action: 'select',
                bap_id: 'api.hailone.in', bap_uri: 'https://api.hailone.in/ondc',
                bpp_id: item.bppId,
                location: { city: { code: 'std:080' }, country: { code: 'IND' } },
                message_id: messageId, timestamp: new Date().toISOString(),
                transaction_id: t.transactionId, ttl: 'P120S', version: '2.0.1'
            },
            message: {
                order: { provider: { id: item.providerId }, items: [{ id: item.id }], fulfillments: [{ id: item.fulfillmentId || "F1" }] }
            }
        };

        const authHeader = await becknAuthService.createAuthorizationHeader(payload);
        const gatewayUrl = 'https://preprod.gateway.ondc.org/select';

        console.log(`Sending to Gateway: ${gatewayUrl}`);
        const response = await axios.post(gatewayUrl, payload, {
            headers: { 'Authorization': authHeader, 'Content-Type': 'application/json' }
        });
        console.log('✅ GATEWAY ACCEPTED SELECT PAYLOAD:', response.data);
    } catch (error) {
        console.error('\n❌ GATEWAY REJECTED SELECT PAYLOAD:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Message:', error.message);
        }
    } finally {
        await mongoose.disconnect();
    }
}
run();
