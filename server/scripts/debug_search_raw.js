import axios from 'axios';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Transaction from '../src/models/Transaction.js';
import { ondcRegistryService } from '../src/services/ondcRegistryService.js';
import { becknAuthService } from '../src/services/becknAuth.js';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hailo');
    const transactionId = uuidv4();
    const payload = {
        context: {
            domain: 'ONDC:TRV10', action: 'search',
            bap_id: 'api.hailone.in', bap_uri: 'https://api.hailone.in/ondc',
            location: { city: { code: 'std:080' }, country: { code: 'IND' } },
            transaction_id: transactionId, message_id: uuidv4(),
            timestamp: new Date().toISOString(), ttl: 'P120S', version: '2.0.1'
        },
        message: {
            intent: { fulfillment: { vehicle: { category: "ANY" }, start: { location: { gps: "12.9715987,77.5945627" } } } }
        }
    };
    
    const gatewayUrl = await ondcRegistryService.getGatewayUrl();
    const authHeader = await becknAuthService.createAuthorizationHeader(payload);
    
    console.log("Sending search to Gateway...");
    try {
        await axios.post(gatewayUrl, payload, { headers: { Authorization: authHeader, 'Content-Type': 'application/json' }});
        console.log("Search sent. Txn ID:", transactionId);
        console.log("Wait for webhook to log raw payload in local PM2/Node logs...");
    } catch (e) { console.error(e.message); }
    process.exit(0);
}
run();
