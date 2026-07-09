const mongoose = require('mongoose');

const otpRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  channel: { type: String, enum: ['email', 'sms'], required: true },
  targetLanguage: { type: String, enum: ['en', 'es', 'hi', 'pt', 'zh', 'fr'], required: true },
  otpHash: { type: String, required: true },
  destination: { type: String, required: true },
  attempts: { type: Number, default: 0, max: 5 },
  resendCount: { type: Number, default: 0, max: 3 },
  status: { type: String, enum: ['pending', 'verified', 'expired', 'failed'], default: 'pending' },
  expiresAt: { type: Date, required: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('OtpRequest', otpRequestSchema);
