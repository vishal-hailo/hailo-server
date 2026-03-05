import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Transaction from '../src/models/Transaction.js';

dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hailo');
    try {
        const t = await Transaction.findOne({ transactionId: '844103e2-e6bd-4826-8095-ca8d7fb387b1' });
        console.log("Transaction Results Object:");
        console.log(JSON.stringify(t.results[0], null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}
run();
