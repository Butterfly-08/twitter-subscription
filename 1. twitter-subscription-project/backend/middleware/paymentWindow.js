const moment = require('moment-timezone');

// payments are only allowed in a fixed 1 hour window IST, everything else gets blocked
// the hours are read from env so it can be changed without touching code

const checkPaymentWindow = (req, res, next) => {
  const startHour = parseInt(process.env.PAYMENT_WINDOW_START_HOUR || '10', 10);
  const endHour = parseInt(process.env.PAYMENT_WINDOW_END_HOUR || '11', 10);

  const nowIST = moment().tz('Asia/Kolkata');
  const currentHour = nowIST.hour();

  if (currentHour < startHour || currentHour >= endHour) {
    return res.status(403).json({
      message: `Payments are allowed only between ${startHour}:00 AM and ${endHour}:00 AM IST. Current IST time is ${nowIST.format('HH:mm')}. Please try again during the allowed window.`,
    });
  }

  next();
};

module.exports = { checkPaymentWindow };
