const express = require('express');
const router = express.Router();
const { createTweet, getNotifiableSince, getFeed } = require('../controllers/tweetController');
const requireAuth = require('../middleware/requireAuth');

router.get('/', getFeed); // optional auth or not
router.post('/', requireAuth, createTweet);
router.get('/notifiable-since', requireAuth, getNotifiableSince);

module.exports = router;
