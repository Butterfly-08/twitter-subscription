const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  phone: { type: String, unique: true, sparse: true },
  phoneNotificationEnabled: { type: Boolean, default: false },
  notificationPreference: {
    enabled: { type: Boolean, default: false },
    updatedAt: { type: Date, default: Date.now }
  },
  loginOtp: { type: String },
  loginOtpExpire: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
