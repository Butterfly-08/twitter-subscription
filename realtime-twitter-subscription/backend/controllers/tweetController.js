const fs = require('fs');
const mm = require('music-metadata');
const Tweet = require('../models/Tweet');
const User = require('../models/User');
const plansConfig = require('../config/plans');
const env = require('../config/env');

// Helper to get current IST month string (e.g., "2026-07")
const getCurrentISTMonth = () => {
  const d = new Date();
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  const nd = new Date(utc + (3600000 * 5.5)); 
  const year = nd.getFullYear();
  const month = (nd.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
};

// Check and increment tweet count based on plan limits
const checkAndIncrementTweetLimit = async (user) => {
  const currentMonth = getCurrentISTMonth();
  
  // Reset count if it's a new month
  if (user.tweetCountMonth !== currentMonth) {
    user.tweetCount = 0;
    user.tweetCountMonth = currentMonth;
  }

  const planInfo = plansConfig[user.plan || 'free'];
  const limit = planInfo.tweetLimit;

  if (limit !== -1 && user.tweetCount >= limit) {
    throw new Error(`You have reached the monthly tweet limit (${limit}) for your ${planInfo.name} plan. Upgrade to post more!`);
  }

  user.tweetCount += 1;
  await user.save();
  return planInfo;
};

const createTextTweet = async (req, res, next) => {
  try {
    const { content } = req.body;
    
    if (!content) {
      return res.status(400).json({ success: false, reason: 'MISSING_CONTENT', message: 'Tweet content is required' });
    }

    if (content.length > 280) {
      return res.status(400).json({ success: false, reason: 'CONTENT_TOO_LONG', message: 'Tweets are capped at 280 characters' });
    }

    // Check plan limits
    try {
      await checkAndIncrementTweetLimit(req.user);
    } catch (limitErr) {
      return res.status(403).json({ success: false, reason: 'TWEET_LIMIT_EXCEEDED', message: limitErr.message });
    }

    const tweet = new Tweet({
      userId: req.user._id,
      authorName: req.user.name,
      authorUsername: req.user.username,
      content,
      type: 'text'
    });

    await tweet.save();

    // Broadcast Tweet to WebSocket clients in Real-Time
    if (req.app.locals.broadcastTweet) {
      req.app.locals.broadcastTweet(tweet);
    }

    res.status(201).json({
      success: true,
      tweet
    });

  } catch (error) {
    next(error);
  }
};

const createAudioTweet = async (req, res, next) => {
  let fileCleanupPath = null;
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, reason: 'MISSING_FILE', message: 'Audio file is required' });
    }

    fileCleanupPath = req.file.path;
    const caption = req.body.caption || '';

    // Duration verification using music-metadata
    let metadata;
    try {
      metadata = await mm.parseFile(fileCleanupPath);
    } catch (err) {
      if (fs.existsSync(fileCleanupPath)) {
        await fs.promises.unlink(fileCleanupPath);
      }
      return res.status(422).json({
        success: false,
        reason: 'UNSUPPORTED_FORMAT',
        message: 'Invalid audio format or corrupted file.'
      });
    }

    const durationSeconds = metadata.format.duration || 0;
    const maxDuration = env.MAX_DURATION_SECONDS || 300;

    if (durationSeconds > maxDuration) {
      if (fs.existsSync(fileCleanupPath)) {
        await fs.promises.unlink(fileCleanupPath);
      }
      return res.status(422).json({
        success: false,
        reason: 'DURATION_TOO_LONG',
        message: `Audio exceeds the maximum duration of ${maxDuration} seconds.`
      });
    }

    // Authenticate upload user using req.userEmail extracted from token in otpAuth
    const user = await User.findOne({ email: req.userEmail });
    if (!user) {
      if (fs.existsSync(fileCleanupPath)) {
        await fs.promises.unlink(fileCleanupPath);
      }
      return res.status(404).json({ success: false, reason: 'USER_NOT_FOUND', message: 'Owner user of this OTP token not found.' });
    }

    // Check plan limits
    try {
      await checkAndIncrementTweetLimit(user);
    } catch (limitErr) {
      if (fs.existsSync(fileCleanupPath)) {
        await fs.promises.unlink(fileCleanupPath);
      }
      return res.status(403).json({ success: false, reason: 'TWEET_LIMIT_EXCEEDED', message: limitErr.message });
    }

    const audioUrl = `/uploads/${req.file.filename}`;

    const tweet = new Tweet({
      userId: user._id,
      authorName: user.name,
      authorUsername: user.username,
      content: caption.substring(0, 280),
      type: 'audio',
      audioUrl,
      durationSeconds: Math.round(durationSeconds),
      sizeBytes: req.file.size
    });

    await tweet.save();

    // Broadcast Tweet in Real-Time
    if (req.app.locals.broadcastTweet) {
      req.app.locals.broadcastTweet(tweet);
    }

    res.status(201).json({
      success: true,
      tweet
    });

  } catch (error) {
    if (fileCleanupPath && fs.existsSync(fileCleanupPath)) {
      fs.promises.unlink(fileCleanupPath).catch(e => console.error('Failed to cleanup file:', e));
    }
    next(error);
  }
};

const getFeed = async (req, res, next) => {
  try {
    const { limit = 30, cursor } = req.query;
    let query = {};
    
    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    const tweets = await Tweet.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10));

    let nextCursor = null;
    if (tweets.length === parseInt(limit, 10)) {
      nextCursor = tweets[tweets.length - 1].createdAt.toISOString();
    }

    res.json({
      success: true,
      tweets,
      nextCursor
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  createTextTweet,
  createAudioTweet,
  getFeed
};
