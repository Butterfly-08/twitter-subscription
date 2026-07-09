const rateLimit = require('express-rate-limit');
const env = require('../config/env');

const authLimiter = rateLimit({
  windowMs: (env.RATE_LIMIT_WINDOW_MINUTES || 15) * 60 * 1000, // 15 mins by default
  max: env.RATE_LIMIT_MAX_REQUESTS || 10, // Max requests per window
  message: {
    success: false,
    reason: 'RATE_LIMITED',
    message: `Too many login attempts. Please try again after ${env.RATE_LIMIT_WINDOW_MINUTES} minutes.`
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { authLimiter };
