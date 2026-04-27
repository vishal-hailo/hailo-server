import mongoose from 'mongoose';
import Transaction from './src/models/Transaction.js';
import { databaseConfig } from './src/config/database.js';

async function check() {
    const transactionId = process.argv[2];
    if (!transactionId) {
        console.error('Usage: node check_transaction.js <transactionId>');
        process.exit(1);
    }

    await mongoose.connect(databaseConfig.url);
    const t = await Transaction.findOne({ transactionId });
    if (!t) {
        console.log('Transaction not found');
    } else {
        console.log(JSON.stringify(t, null, 2));
    }
    await mongoose.disconnect();
    process.exit(0);
}
check();
