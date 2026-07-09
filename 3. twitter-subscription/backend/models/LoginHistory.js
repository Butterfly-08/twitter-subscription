const mongoose = require('mongoose');

const loginHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    browser: {
      type: String,
      default: 'Unknown',
    },
    os: {
      type: String,
      default: 'Unknown',
    },
    deviceType: {
      type: String,
      enum: ['desktop', 'laptop', 'mobile', 'tablet', 'unknown'],
      default: 'unknown',
    },
    ipAddress: {
      type: String,
      default: 'Unknown',
    },
    otpRequired: {
      type: Boolean,
      default: false,
    },
    loginTime: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('LoginHistory', loginHistorySchema);
