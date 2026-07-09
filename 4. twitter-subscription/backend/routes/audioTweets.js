const express = require('express');
const router = express.Router();
const fs = require('fs');
const mm = require('music-metadata');
const AudioTweet = require('../models/AudioTweet');
const { timeWindowMiddleware, computeWindowStatus } = require('../middleware/timeWindow');
const otpAuthMiddleware = require('../middleware/otpAuth');
const uploadMiddleware = require('../middleware/uploadHandler');

// GET /api/audio-tweets/window-status
router.get('/window-status', (req, res) => {
    const status = computeWindowStatus();
    res.status(200).json(status);
});

// POST /api/audio-tweets/upload
// Middleware order: otpAuth -> timeWindow -> multer upload -> durationValidation -> controller
router.post('/upload', 
    otpAuthMiddleware, 
    timeWindowMiddleware, 
    uploadMiddleware, 
    async (req, res) => {
        try {
            // File is already saved to disk by multer at this point
            const filePath = req.file.path;
            
            // Duration Validation
            let metadata;
            try {
                metadata = await mm.parseFile(filePath);
            } catch (err) {
                // Not a valid audio file or parsing failed
                await fs.promises.unlink(filePath);
                return res.status(422).json({
                    success: false,
                    reason: 'UNSUPPORTED_FORMAT',
                    message: 'Invalid audio format or corrupted file.'
                });
            }

            const durationSeconds = metadata.format.duration || 0;
            const maxDuration = parseInt(process.env.MAX_DURATION_SECONDS) || 300;

            if (durationSeconds > maxDuration) {
                await fs.promises.unlink(filePath);
                return res.status(422).json({
                    success: false,
                    reason: 'DURATION_TOO_LONG',
                    message: `Audio exceeds the maximum duration of ${maxDuration} seconds.`
                });
            }

            // Create AudioTweet record
            const sizeBytes = req.file.size;
            const caption = req.body.caption ? req.body.caption.substring(0, 280) : '';
            const audioUrl = `/uploads/${req.file.filename}`;

            const tweet = new AudioTweet({
                authorEmail: req.userEmail,
                caption,
                filePath,
                audioUrl,
                durationSeconds: Math.round(durationSeconds),
                sizeBytes
            });

            await tweet.save();

            res.status(201).json({
                success: true,
                tweet: {
                    id: tweet._id,
                    author: tweet.authorEmail,
                    caption: tweet.caption,
                    audioUrl: tweet.audioUrl,
                    durationSeconds: tweet.durationSeconds,
                    sizeBytes: tweet.sizeBytes,
                    createdAt: tweet.createdAt
                }
            });

        } catch (err) {
            console.error('Upload error:', err);
            // Cleanup file if it exists
            if (req.file && req.file.path) {
                fs.promises.unlink(req.file.path).catch(e => console.error('Failed to cleanup file:', e));
            }
            res.status(500).json({ success: false, reason: 'SERVER_ERROR', message: 'Internal server error during upload.' });
        }
});

// GET /api/audio-tweets/feed
router.get('/feed', async (req, res) => {
    try {
        const { limit = 20, cursor } = req.query;
        let query = {};
        
        if (cursor) {
            query.createdAt = { $lt: new Date(cursor) };
        }

        const tweets = await AudioTweet.find(query)
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        let nextCursor = null;
        if (tweets.length === parseInt(limit)) {
            nextCursor = tweets[tweets.length - 1].createdAt.toISOString();
        }

        const formattedTweets = tweets.map(t => ({
            id: t._id,
            author: t.authorEmail,
            caption: t.caption,
            audioUrl: t.audioUrl,
            durationSeconds: t.durationSeconds,
            sizeBytes: t.sizeBytes,
            createdAt: t.createdAt
        }));

        res.status(200).json({
            success: true,
            tweets: formattedTweets,
            nextCursor
        });

    } catch (err) {
        console.error('Feed error:', err);
        res.status(500).json({ success: false, reason: 'SERVER_ERROR', message: 'Error fetching feed.' });
    }
});

module.exports = router;
