const PLANS = require('../config/plans');

// @desc get list of all available plans
// @route GET /api/plans
const getPlans = (req, res) => {
  res.json(PLANS);
};

// @desc get current logged in user's plan info
// @route GET /api/plans/my-plan
const getMyPlan = async (req, res) => {
  const user = req.user;
  const planDetails = PLANS[user.plan];

  res.json({
    plan: user.plan,
    planName: planDetails.name,
    tweetLimit: planDetails.tweetLimit,
    tweetCount: user.tweetCount,
    planExpiry: user.planExpiry,
  });
};

module.exports = { getPlans, getMyPlan };
