const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, unique: true, sparse: true },
  email: { type: String, required: true, unique: true, index: true },
  mobileNumber: { type: String, required: true, unique: true, index: true },
  passwordHash: { type: String, required: true },
  preferredLanguage: { 
    type: String, 
    enum: ['en', 'es', 'hi', 'pt', 'zh', 'fr'], 
    default: 'en' 
  },
  isEmailVerified: { type: Boolean, default: false },
  isMobileVerified: { type: Boolean, default: false },
  loginOtp: { type: String },
  loginOtpExpire: { type: Date }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
