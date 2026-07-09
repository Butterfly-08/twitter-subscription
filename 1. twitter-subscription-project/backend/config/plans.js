// keeping plan data in one place so its easy to change price/limits later
// tweetLimit -1 means unlimited

const PLANS = {
  free: {
    name: 'Free Plan',
    price: 0,
    tweetLimit: 1,
  },
  bronze: {
    name: 'Bronze Plan',
    price: 100,
    tweetLimit: 3,
  },
  silver: {
    name: 'Silver Plan',
    price: 300,
    tweetLimit: 5,
  },
  gold: {
    name: 'Gold Plan',
    price: 1000,
    tweetLimit: -1,
  },
};

module.exports = PLANS;
