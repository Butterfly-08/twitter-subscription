const express = require('express');
const router = express.Router();
const { createTweet, getMyTweets, getAllTweets } = require('../controllers/tweetController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createTweet);
router.get('/', protect, getMyTweets);
router.get('/all', getAllTweets);

module.exports = router;
