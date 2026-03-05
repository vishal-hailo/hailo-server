import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Transaction from '../src/models/Transaction.js';

dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hailo');
    try {
        const txs = await Transaction.find({ results: { $not: { $size: 0 } } }).sort({ createdAt: -1 }).limit(5);
        txs.forEach((t, i) => {
            console.log(`\nTxn ${i + 1}: ${t.transactionId}`);
            console.log(`Results: ${t.results.length}`);
            if (t.results.length > 0) {
                console.log(`BPP ID: ${t.results[0].bppId}`);
                console.log(`BPP URI: ${t.results[0].bppUri}`);
            }
        });
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}
run();
