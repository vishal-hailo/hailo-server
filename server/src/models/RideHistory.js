import mongoose from 'mongoose';

const rideHistorySchema = new mongoose.Schema({
    timestamp: { type: Date, required: true },
    location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number], required: true } // [longitude, latitude]
    },
    providerId: { type: String, required: true },
    providerName: String,
    price: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    surgeMultiplier: { type: Number, default: 1.0 }, // Calculated based on base fare if available
    vehicleType: String,
    transactionId: String
}, {
    timeseries: {
        timeField: 'timestamp',
        metaField: 'providerId',
        granularity: 'minutes'
    }
});

rideHistorySchema.index({ location: '2dsphere' });
rideHistorySchema.index({ timestamp: 1 });

const RideHistory = mongoose.model('RideHistory', rideHistorySchema);
export default RideHistory;
