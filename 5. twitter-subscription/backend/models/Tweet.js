const mongoose = require('mongoose');

const tweetSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorUsername: { type: String, required: true }, // denormalized for fast reads
  content: { type: String, required: true, maxlength: 280 },
  isNotifiable: { type: Boolean, default: false, index: true },
  matchedKeywords: [{ type: String }],
  createdAt: { type: Date, default: Date.now, index: true }
});

module.exports = mongoose.model('Tweet', tweetSchema);
