import mongoose from 'mongoose';

const insightSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  period: {
    type: String,
    enum: ['DAILY', 'WEEKLY', 'MONTHLY'],
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  metrics: {
    totalRides: Number,
    totalSpent: Number,
    totalSaved: Number,
    avgPricePerRide: Number,
    peakHours: [String],
    cheapestHours: [String],
    surgePeriods: Number,
    surgeAvoided: Number,
  },
  breakdown: [{
    category: String,
    amount: Number,
    percentage: Number,
  }],
  topRoutes: [{
    from: String,
    to: String,
    rides: Number,
    saved: Number,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Insight', insightSchema);