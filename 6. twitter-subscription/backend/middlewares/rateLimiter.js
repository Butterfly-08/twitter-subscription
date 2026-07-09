const rateLimit = require('express-rate-limit');
const env = require('../config/env');

const otpRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000, 
  max: env.RATE_LIMIT_MAX_REQUESTS,
  message: {
    success: false,
    code: 'LANG_002',
    message: 'Too many OTP requests. Try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { otpRateLimiter };
