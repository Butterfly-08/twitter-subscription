const mongoose = require('mongoose');

const otpRequestSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  targetLanguage: { type: String, required: true },
  channel: { 
    type: String, 
    enum: ['email', 'sms'], 
    required: true 
  },
  destination: { type: String, required: true }, // phone or email
  otpHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  attempts: { type: Number, default: 0 },
  resendCount: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['pending', 'verified', 'expired', 'failed'], 
    default: 'pending' 
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('OtpRequest', otpRequestSchema);
