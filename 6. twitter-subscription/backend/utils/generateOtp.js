const crypto = require('crypto');
const env = require('../config/env');

const generateOtp = () => {
  // Generate a random 6-digit number
  const min = Math.pow(10, env.OTP_LENGTH - 1);
  const max = Math.pow(10, env.OTP_LENGTH) - 1;
  return crypto.randomInt(min, max).toString();
};

module.exports = generateOtp;
