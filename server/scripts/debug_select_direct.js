import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Transaction from '../src/models/Transaction.js';
import { ondcService } from '../src/services/ondcService.js';

dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hailo');
    try {
        console.log('Connected to DB. Starting Direct Select...');
        const t = await Transaction.findOne({ transactionId: '844103e2-e6bd-4826-8095-ca8d7fb387b1' });
        const selectedQuote = t.results[0];
        
        console.log('Sending payload with Provider:', selectedQuote.providerId, 'Item:', selectedQuote.id);
        await ondcService.select(t.transactionId, selectedQuote.providerId, selectedQuote.id);
        console.log('✅ Select succeeded');
    } catch (error) {
        console.error('❌ Caught top-level error:');
        console.error(error.message);
    } finally {
        await mongoose.disconnect();
    }
}
run();
