const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: false,
      trim: true,
      unique: true,
      sparse: true, // allows multiple users with no phone set, but no duplicates among ones that do
    },
    password: {
      type: String,
      required: true,
    },
    plan: {
      type: String,
      enum: ['free', 'bronze', 'silver', 'gold'],
      default: 'free',
    },
    planExpiry: {
      type: Date,
      default: null,
    },
    tweetCount: {
      type: Number,
      default: 0,
    },
    // resets tweetCount every month, this tracks which month the count belongs to
    tweetCountMonth: {
      type: String,
      default: '',
    },
    // tracks the last time this user successfully requested a password reset,
    // used to block more than one reset request per day
    lastPasswordResetRequest: {
      type: Date,
      default: null,
    },
    // used only during the chrome login OTP step, cleared right after verification
    loginOtp: {
      type: String,
      default: null,
    },
    loginOtpExpire: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
