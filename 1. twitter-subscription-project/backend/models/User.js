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
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpire: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
