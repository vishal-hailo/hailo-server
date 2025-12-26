import mongoose from 'mongoose';

const rideSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['SCHEDULED', 'COMPLETED', 'CANCELLED', 'RECURRING'],
    required: true,
  },
  from: {
    label: String,
    address: String,
    latitude: Number,
    longitude: Number,
  },
  to: {
    label: String,
    address: String,
    latitude: Number,
    longitude: Number,
  },
  scheduledTime: Date,
  completedTime: Date,
  price: Number,
  estimatedPrice: Number,
  distance: Number,
  duration: Number,
  savedAmount: Number,
  provider: {
    type: String,
    enum: ['UBER', 'OLA', 'MOCK'],
    default: 'MOCK',
  },
  status: {
    type: String,
    enum: ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    default: 'PENDING',
  },
  recurringPattern: {
    enabled: Boolean,
    days: [Boolean], // [Mon, Tue, Wed, Thu, Fri, Sat, Sun]
    time: String,
  },
  driver: {
    name: String,
    phone: String,
    rating: Number,
    vehicle: String,
    plateNumber: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model('Ride', rideSchema);