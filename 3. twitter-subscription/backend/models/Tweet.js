const mongoose = require('mongoose');

const tweetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 280,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Tweet', tweetSchema);
