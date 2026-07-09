const crypto = require('crypto');
const env = require('../config/env');

const hashOtp = (otp) => {
  return crypto.createHmac('sha256', env.OTP_HASH_SECRET)
               .update(otp)
               .digest('hex');
};

const verifyOtp = (otp, hash) => {
  const generatedHash = hashOtp(otp);
  return generatedHash === hash;
};

module.exports = { hashOtp, verifyOtp };
