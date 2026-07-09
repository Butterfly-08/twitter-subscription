const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  username: { type: String, required: true, unique: true, index: true, trim: true },
  email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
  phone: { type: String, unique: true, sparse: true, trim: true },
  passwordHash: { type: String, required: true },
  preferredLanguage: { 
    type: String, 
    enum: ['en', 'es', 'hi', 'pt', 'zh', 'fr'], 
    default: 'en' 
  },
  isEmailVerified: { type: Boolean, default: false },
  isMobileVerified: { type: Boolean, default: false },
  loginOtp: { type: String, default: null },
  loginOtpExpire: { type: Date, default: null },
  
  // Subscription Plan fields
  plan: { 
    type: String, 
    enum: ['free', 'bronze', 'silver', 'gold'], 
    default: 'free' 
  },
  planExpiry: { type: Date, default: null },
  tweetCount: { type: Number, default: 0 },
  tweetCountMonth: { type: String, default: '' }, // e.g. "2026-07"
  
  // Security rates
  lastPasswordResetRequest: { type: Date, default: null },
  
  // Notification Preferences
  notificationPreference: {
    enabled: { type: Boolean, default: false },
    keywords: { type: String, default: 'cricket,science' },
    updatedAt: { type: Date, default: Date.now }
  },
  phoneNotificationEnabled: { type: Boolean, default: false }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
