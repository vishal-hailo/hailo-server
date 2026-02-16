import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
    transactionId: { type: String, index: true }, // ONDC Transaction ID
    messageId: { type: String },
    action: { type: String, required: true }, // e.g., 'search', 'on_search'
    direction: { type: String, enum: ['OUTBOUND', 'INBOUND'], required: true },
    source: { type: String }, // BPP ID or Subscriber ID
    destination: { type: String },
    payload: { type: Object }, // The full JSON body
    headers: { type: Object }, // Auth headers etc.
    status: { type: String, enum: ['SUCCESS', 'ERROR', 'ACK', 'NACK', 'PROCESSING'], default: 'SUCCESS' },
    error: { type: Object }, // Error object if any
    timestamp: { type: Date, default: Date.now }
});

// Create a TTL index to auto-delete logs after 7 days to save space
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 604800 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export default AuditLog;
