const env = require('../config/env');

const isWithinMobileLoginWindow = () => {
  // Convert current server time to IST (UTC +5.5)
  const d = new Date();
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  const nd = new Date(utc + (3600000 * 5.5)); 
  
  const hour = nd.getHours();
  const start = env.MOBILE_LOGIN_WINDOW_START_HOUR; // 10
  const end = env.MOBILE_LOGIN_WINDOW_END_HOUR; // 13
  
  return hour >= start && hour < end;
};

module.exports = { isWithinMobileLoginWindow };
