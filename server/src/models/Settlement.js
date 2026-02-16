import mongoose from 'mongoose';

const settlementSchema = new mongoose.Schema({
    transactionId: { type: String, required: true, index: true },
    orderId: { type: String, required: true },
    settlementId: { type: String }, // ID from the settlement agency/bank
    amount: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    status: { type: String, enum: ['PENDING', 'SETTLED', 'DISPUTED'], default: 'PENDING' },
    settlementType: { type: String }, // e.g., 'NEFT', 'UPI'
    urn: { type: String }, // UTR number
    timestamp: { type: Date, default: Date.now },
    details: { type: Object } // Full payload for reference
});

const Settlement = mongoose.model('Settlement', settlementSchema);
export default Settlement;
