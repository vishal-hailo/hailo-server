import mongoose from 'mongoose';
import dotenv from 'dotenv';
import AuditLog from '../src/models/AuditLog.js';

dotenv.config();

async function run() {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hailo');
    try {
        const log = await AuditLog.findOne({ transactionId: '844103e2-e6bd-4826-8095-ca8d7fb387b1', action: 'on_search' });
        if (log) {
            console.log("Raw on_search payload:");
            console.log(JSON.stringify(log.payload, null, 2));
        } else {
            console.log("No on_search audit log found for this transaction.");
        }
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}
run();
