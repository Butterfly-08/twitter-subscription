const jwt = require('jsonwebtoken');
const env = require('../config/env');

const generateOtpToken = (email) => {
  return jwt.sign({ email }, env.JWT_SECRET, { expiresIn: '2m' }); 
};

const verifyOtpToken = (token) => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    return { valid: true, decoded };
  } catch (error) {
    return { valid: false, reason: 'INVALID_OTP_TOKEN', error: error.message };
  }
};

module.exports = { generateOtpToken, verifyOtpToken };
