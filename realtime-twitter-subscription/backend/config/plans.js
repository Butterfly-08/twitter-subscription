module.exports = {
  free: {
    name: 'Free',
    price: 0,
    tweetLimit: 1
  },
  bronze: {
    name: 'Bronze',
    price: 100,
    tweetLimit: 3
  },
  silver: {
    name: 'Silver',
    price: 300,
    tweetLimit: 5
  },
  gold: {
    name: 'Gold',
    price: 1000,
    tweetLimit: -1 // -1 means unlimited
  }
};
