const env = require('../config/env');

const computeWindowStatus = () => {
  const d = new Date();
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  const nd = new Date(utc + (3600000 * 5.5)); 
  
  const hour = nd.getHours();
  const minutes = nd.getMinutes();
  const currentTimeString = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  
  const start = env.UPLOAD_WINDOW_START_IST; // '14:00'
  const end = env.UPLOAD_WINDOW_END_IST; // '19:00'
  
  const isAllowed = currentTimeString >= start && currentTimeString < end;
  
  return {
    currentTime: currentTimeString,
    allowedWindow: `${start} - ${end} IST`,
    isAllowed
  };
};

const timeWindowMiddleware = (req, res, next) => {
  if (env.DEV_BYPASS_TIME_WINDOW) {
    return next();
  }
  
  const status = computeWindowStatus();
  if (!status.isAllowed) {
    return res.status(403).json({
      success: false,
      reason: 'UPLOAD_WINDOW_CLOSED',
      message: `Audio uploads are restricted to the ${status.allowedWindow} time window. Current IST time is ${status.currentTime}.`
    });
  }
  next();
};

module.exports = { timeWindowMiddleware, computeWindowStatus };
