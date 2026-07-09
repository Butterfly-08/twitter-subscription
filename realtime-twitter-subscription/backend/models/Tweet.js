const mongoose = require('mongoose');

const tweetSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    index: true
  },
  authorName: { type: String, required: true },
  authorUsername: { type: String, required: true },
  content: { type: String, default: '', trim: true },
  type: { 
    type: String, 
    enum: ['text', 'audio'], 
    default: 'text' 
  },
  // Audio specific fields
  audioUrl: { type: String, default: null },
  durationSeconds: { type: Number, default: null },
  sizeBytes: { type: Number, default: null }
}, {
  timestamps: true
});

module.exports = mongoose.model('Tweet', tweetSchema);
