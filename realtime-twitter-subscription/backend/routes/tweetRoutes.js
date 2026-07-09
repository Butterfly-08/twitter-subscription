const express = require('express');
const router = express.Router();
const requireAuth = require('../middlewares/auth');
const otpAuthMiddleware = require('../middlewares/otpAuth');
const { timeWindowMiddleware, computeWindowStatus } = require('../middlewares/timeWindow');
const uploadMiddleware = require('../middlewares/uploadHandler');
const {
  createTextTweet,
  createAudioTweet,
  getFeed
} = require('../controllers/tweetController');

// GET window-status for audio uploading
router.get('/upload-window-status', (req, res) => {
  const status = computeWindowStatus();
  res.json(status);
});

router.get('/feed', requireAuth, getFeed);
router.post('/text', requireAuth, createTextTweet);

// POST /api/tweets/audio-upload
// Order of middleware: otpAuth -> timeWindow -> upload (multer) -> controller
router.post('/audio-upload', otpAuthMiddleware, timeWindowMiddleware, uploadMiddleware, createAudioTweet);

module.exports = router;
