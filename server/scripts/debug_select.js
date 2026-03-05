import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Transaction from '../src/models/Transaction.js';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hailo')
    .then(async () => {
        const t = await Transaction.findOne({ transactionId: '844103e2-e6bd-4826-8095-ca8d7fb387b1' });
        console.log("Transaction ID:", t.transactionId);
        console.log("Selected Item's BPP URI:", t.results[0].bppUri);
        console.log("Selected Item's BPP ID:", t.results[0].bppId);
        process.exit(0);
    });
