const Tweet = require('../models/Tweet');
const User = require('../models/User');
const { detectKeywords } = require('../utils/keywordDetector');

async function createTweet(req, res) {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ success: false, reason: 'INVALID_BODY', message: 'Content is required' });
    }

    const { isNotifiable, matchedKeywords } = detectKeywords(content);

    const tweet = new Tweet({
      author: req.user.id,
      authorUsername: req.user.username,
      content,
      isNotifiable,
      matchedKeywords
    });

    await tweet.save();

    res.status(201).json({
      success: true,
      tweet: {
        id: tweet._id,
        author: tweet.author,
        authorUsername: tweet.authorUsername,
        content: tweet.content,
        isNotifiable: tweet.isNotifiable,
        matchedKeywords: tweet.matchedKeywords,
        createdAt: tweet.createdAt
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, reason: 'SERVER_ERROR', message: err.message });
  }
}

async function getNotifiableSince(req, res) {
  try {
    const since = req.query.since;
    if (!since) {
      return res.status(400).json({ success: false, reason: 'INVALID_BODY', message: 'Since timestamp required' });
    }

    const user = await User.findById(req.user.id);
    if (!user || !user.notificationPreference.enabled) {
      return res.json({ success: true, tweets: [] }); // preference off -> nothing to push
    }

    const tweets = await Tweet.find({
      isNotifiable: true,
      createdAt: { $gt: new Date(Number(since)) }
    }).select('content authorUsername createdAt').lean();

    // Map to expected format
    const formattedTweets = tweets.map(t => ({
      id: t._id,
      author: t.authorUsername, // specification says author in the frontend expects username
      content: t.content,
      createdAt: t.createdAt
    }));

    res.json({ success: true, tweets: formattedTweets });
  } catch (err) {
    res.status(500).json({ success: false, reason: 'SERVER_ERROR', message: err.message });
  }
}

async function getFeed(req, res) {
  try {
    // Basic feed endpoint: last 50 tweets
    const tweets = await Tweet.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .select('content authorUsername createdAt isNotifiable')
      .lean();
    
    const formattedTweets = tweets.map(t => ({
      id: t._id,
      author: t.authorUsername,
      content: t.content,
      createdAt: t.createdAt,
      isNotifiable: t.isNotifiable
    }));
      
    res.json({ success: true, tweets: formattedTweets });
  } catch (err) {
    res.status(500).json({ success: false, reason: 'SERVER_ERROR', message: err.message });
  }
}

module.exports = { createTweet, getNotifiableSince, getFeed };
