import mongoose from 'mongoose';
import AuditLog from './src/models/AuditLog.js';
import dotenv from 'dotenv';
dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hailo');
        console.log('✅ MongoDB connected');
    } catch (error) {
        console.error('MongoDB Connection Error:', error);
        process.exit(1);
    }
};

const checkLogs = async () => {
    await connectDB();

    // Give some time for logs to be written (async)
    setTimeout(async () => {
        const count = await AuditLog.countDocuments();
        console.log(`\n📊 Total Audit Logs in DB: ${count}`);

        if (count > 0) {
            const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(3);
            console.log('--- Latest 3 Logs ---');
            logs.forEach(log => {
                console.log(`[${log.timestamp.toISOString()}] ${log.direction} ${log.action} | Status: ${log.status}`);
                if (log.action === 'confirm' && log.direction === 'OUTBOUND') {
                    console.log('--- Confirm Payment Details ---');
                    console.log(JSON.stringify(log.payload?.message?.order?.payment, null, 2));
                }
            });
            console.log('✅ Audit Logging Verified!');
            process.exit(0);
        } else {
            console.error('❌ No Audit Logs found!');
            process.exit(1);
        }
    }, 2000);
};

checkLogs();
