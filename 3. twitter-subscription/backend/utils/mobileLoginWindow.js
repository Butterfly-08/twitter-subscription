const moment = require('moment-timezone');

// mobile logins are only allowed in a fixed window IST, returns null if allowed
// or an error message string if blocked. desktop/laptop/tablet are never restricted here.
function checkMobileLoginWindow(deviceType) {
  if (deviceType !== 'mobile') {
    return null;
  }

  const startHour = parseInt(process.env.MOBILE_LOGIN_WINDOW_START_HOUR || '10', 10);
  const endHour = parseInt(process.env.MOBILE_LOGIN_WINDOW_END_HOUR || '13', 10);

  const nowIST = moment().tz('Asia/Kolkata');
  const currentHour = nowIST.hour();

  if (currentHour < startHour || currentHour >= endHour) {
    return `Mobile login is only allowed between ${startHour}:00 AM and ${endHour > 12 ? endHour - 12 : endHour}:00 PM IST. Current IST time is ${nowIST.format('HH:mm')}. Please try again during the allowed window or use a desktop/laptop.`;
  }

  return null;
}

module.exports = { checkMobileLoginWindow };
