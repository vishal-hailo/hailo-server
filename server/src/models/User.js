import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  name: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
  },
  profileImage: String,
  rating: {
    type: Number,
    default: 0,
  },
  totalRides: {
    type: Number,
    default: 0,
  },
  totalDistance: {
    type: Number,
    default: 0,
  },
  totalSaved: {
    type: Number,
    default: 0,
  },
  timeSaved: {
    type: Number,
    default: 0,
  },
  settings: {
    notifications: {
      surgeAlerts: { type: Boolean, default: true },
      priceDrops: { type: Boolean, default: true },
      rideReminders: { type: Boolean, default: true },
      promotions: { type: Boolean, default: false },
      weeklyReports: { type: Boolean, default: true },
      pushNotifications: { type: Boolean, default: true },
      emailNotifications: { type: Boolean, default: false },
      smsNotifications: { type: Boolean, default: false }
    },
    shareLocation: {
      type: Boolean,
      default: true
    },
    shareRideHistory: {
      type: Boolean,
      default: false
    },
    personalizedAds: {
      type: Boolean,
      default: false
    },
    analyticsSharing: {
      type: Boolean,
      default: true
    },
    language: {
      type: String,
      default: 'en'
    },
    theme: {
      type: String,
      default: 'system'
    }
  },
  linkedAccounts: {
    uber: {
      accessToken: String,
      refreshToken: String,
      expiresAt: Date,
      tokenType: String,
      scope: String,
      linkedAt: Date
    }
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.pre('save', async function () {
  this.updatedAt = Date.now();
});

export default mongoose.model('User', userSchema);