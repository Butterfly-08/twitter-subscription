const mongoose = require('mongoose');

const loginHistorySchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  ipAddress: { type: String, default: '' },
  browser: { type: String, default: 'Unknown' },
  os: { type: String, default: 'Unknown' },
  deviceType: { type: String, default: 'desktop' }, // desktop, mobile, tablet
  userAgent: { type: String, default: '' },
  status: { 
    type: String, 
    enum: ['success', 'otp_pending', 'failed'], 
    default: 'success' 
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('LoginHistory', loginHistorySchema);
