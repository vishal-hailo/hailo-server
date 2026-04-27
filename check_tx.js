import mongoose from 'mongoose';
import Transaction from './server/src/models/Transaction.js';
import dotenv from 'dotenv';
dotenv.config({ path: './server/.env' });

async function check() {
    const transactionId = process.argv[2];
    if (!transactionId) {
        console.error('Usage: node check_tx.js <transactionId>');
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI);
    const tx = await Transaction.findOne({ transactionId });
    if (!tx) {
        console.log('Transaction not found');
    } else {
        console.log('Results count:', tx.results.length);
        tx.results.forEach((r, i) => {
            console.log(`[${i}] ID: ${r.id}, ProviderID: ${r.providerId}, BppId: ${r.bppId}`);
        });
    }
    await mongoose.disconnect();
}

check();
