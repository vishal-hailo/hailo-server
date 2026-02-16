import mongoose from 'mongoose';

const issueSchema = new mongoose.Schema({
    issueId: { type: String, required: true, unique: true }, // Internal or ONDC UUID
    transactionId: { type: String, required: true }, // Linked ONDC transaction
    category: {
        type: String,
        enum: ['FULFILLMENT', 'ITEM', 'PAYMENT', 'AGENT', 'CANCELLATION'],
        required: true
    },
    subCategory: { type: String }, // standardized code e.g. 'FLM01'
    status: {
        type: String,
        enum: ['OPEN', 'PROCESSING', 'RESOLVED', 'CLOSED'],
        default: 'OPEN'
    },
    description: { type: String }, // User description
    complainant: {
        id: { type: String }, // User ID
        email: { type: String },
        phone: { type: String }
    },
    respondent: {
        id: { type: String }, // Provider ID/BPP ID
        name: { type: String }
    },
    resolution: {
        shortDesc: { type: String },
        longDesc: { type: String },
        actionTriggered: { type: String },
        refundAmount: { type: String }
    },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

const Grievance = mongoose.model('Grievance', issueSchema);
export default Grievance;
