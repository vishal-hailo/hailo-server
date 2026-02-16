import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
    transactionId: { type: String, required: true, unique: true, index: true },
    status: {
        type: String,
        enum: [
            'SEARCH_INITIATED', 'SEARCH_COMPLETED',
            'SELECT_INITIATED', 'QUOTE_RECEIVED', 'SELECT_ERROR',
            'INIT_INITIATED', 'INIT_COMPLETED',
            'CONFIRM_INITIATED', 'CONFIRMED', 'CANCELLED'
        ],
        default: 'SEARCH_INITIATED'
    },
    location: {
        latitude: Number,
        longitude: Number,
        destination: {
            latitude: Number,
            longitude: Number
        }
    },
    results: { type: Array, default: [] }, // Search results
    selectedItem: { type: Object }, // Selected provider/item
    quote: { type: Object }, // Quote from on_select
    initOrder: { type: Object }, // Order details from on_init
    confirmedOrder: { type: Object }, // Final order from on_confirm
    uberEstimate: { type: Object }, // Snapshot of Uber estimate

    // Fulfillment & Tracking
    fulfillmentStatus: { type: String, default: 'PENDING' }, // PENDING, AGENT-ASSIGNED, OT_THE_WAY, ARRIVED, RIDE_STARTED, COMPLETED
    driverLocation: {
        latitude: Number,
        longitude: Number,
        heading: Number,
        updatedAt: Date
    },
    rideHistory: [{ // Breadcrumbs for map
        latitude: Number,
        longitude: Number,
        timestamp: Date
    }]
}, { timestamps: true });

// transactionSchema.pre('save', function (next) {
//     this.updatedAt = Date.now();
//     next();
// });

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;
