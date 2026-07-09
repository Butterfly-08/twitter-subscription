const Tweet = require('../models/Tweet');
const User = require('../models/User');
const PLANS = require('../config/plans');
const moment = require('moment-timezone');

// helper - returns current month tag like "2026-6", used to reset counts every month
const getCurrentMonthTag = () => {
  const now = moment().tz('Asia/Kolkata');
  return `${now.year()}-${now.month()}`;
};

// @desc post a new tweet, checks plan limit before allowing
// @route POST /api/tweets
const createTweet = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Tweet content cannot be empty' });
    }

    if (content.length > 280) {
      return res.status(400).json({ message: 'Tweet cannot be more than 280 characters' });
    }

    const user = req.user;
    const currentMonthTag = getCurrentMonthTag();

    // if user's saved month tag doesn't match current month, reset their count
    if (user.tweetCountMonth !== currentMonthTag) {
      user.tweetCount = 0;
      user.tweetCountMonth = currentMonthTag;
    }

    // check if plan has expired, downgrade to free if so
    if (user.plan !== 'free' && user.planExpiry && new Date() > new Date(user.planExpiry)) {
      user.plan = 'free';
      user.planExpiry = null;
    }

    const planDetails = PLANS[user.plan];
    const limit = planDetails.tweetLimit;

    if (limit !== -1 && user.tweetCount >= limit) {
      return res.status(403).json({
        message: `You have reached your ${planDetails.name} limit of ${limit} tweet(s) this month. Please upgrade your plan to post more.`,
      });
    }

    const tweet = await Tweet.create({
      user: user._id,
      content,
    });

    user.tweetCount += 1;
    await user.save();

    res.status(201).json({
      tweet,
      remainingTweets: limit === -1 ? 'unlimited' : limit - user.tweetCount,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Something went wrong while posting tweet' });
  }
};

// @desc get all tweets of logged in user
// @route GET /api/tweets
const getMyTweets = async (req, res) => {
  try {
    const tweets = await Tweet.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(tweets);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Something went wrong while fetching tweets' });
  }
};

// @desc get all tweets, for a public feed
// @route GET /api/tweets/all
const getAllTweets = async (req, res) => {
  try {
    const tweets = await Tweet.find({}).populate('user', 'name email plan').sort({ createdAt: -1 }).limit(50);
    res.json(tweets);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Something went wrong while fetching tweets' });
  }
};

module.exports = { createTweet, getMyTweets, getAllTweets };
