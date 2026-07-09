const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const audioTweetSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: uuidv4,
    },
    authorEmail: {
        type: String,
        required: true,
    },
    caption: {
        type: String,
        maxlength: 280,
    },
    filePath: {
        type: String,
        required: true,
    },
    audioUrl: {
        type: String,
        required: true,
    },
    durationSeconds: {
        type: Number,
        required: true,
    },
    sizeBytes: {
        type: Number,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

module.exports = mongoose.model('AudioTweet', audioTweetSchema);
