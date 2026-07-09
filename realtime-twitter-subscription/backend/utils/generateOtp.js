const env = require('../config/env');

const generateOtp = () => {
  const length = env.OTP_LENGTH || 6;
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
};

module.exports = generateOtp;
