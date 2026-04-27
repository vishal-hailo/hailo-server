import mongoose from 'mongoose';
import { databaseConfig } from './src/config/database.js';
import Transaction from './src/models/Transaction.js';

async function check() {
    try {
        const transactionId = process.argv[2];
        if (!transactionId) {
            console.error('Usage: node check_tx.js <transactionId>');
            process.exit(1);
        }

        await mongoose.connect(databaseConfig.url);
        const tx = await Transaction.findOne({ transactionId });
        if (tx) {
            console.log('Transaction Found:');
            console.log('Status:', tx.status);
            console.log('Fulfillment Status:', tx.fulfillmentStatus);
            console.log('Order ID:', tx.confirmedOrder?.id);
        } else {
            console.log('Transaction NOT found');
        }
        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
check();
