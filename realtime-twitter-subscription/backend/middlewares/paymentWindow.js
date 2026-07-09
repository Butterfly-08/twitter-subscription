const env = require('../config/env');

const paymentWindowMiddleware = (req, res, next) => {
  // Convert current server time to IST (UTC +5.5)
  const d = new Date();
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  const nd = new Date(utc + (3600000 * 5.5)); 
  
  const hour = nd.getHours();
  const start = env.PAYMENT_WINDOW_START_HOUR; // 10
  const end = env.PAYMENT_WINDOW_END_HOUR; // 11
  
  if (hour < start || hour >= end) {
    return res.status(403).json({
      success: false,
      reason: 'PAYMENT_WINDOW_CLOSED',
      message: `Payments are restricted to the ${start}:00 AM - ${end}:00 AM IST time window.`
    });
  }
  next();
};

module.exports = paymentWindowMiddleware;
