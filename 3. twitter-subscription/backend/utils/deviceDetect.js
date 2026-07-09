const { UAParser } = require('ua-parser-js');

// pulls browser, os, device type and ip out of a request, used during login
// to decide which auth rules apply (chrome OTP, mobile time window, etc)
function getDeviceInfo(req) {
  const userAgentString = req.headers['user-agent'] || '';
  const parser = new UAParser(userAgentString);
  const result = parser.getResult();

  const browserName = result.browser.name || 'Unknown';
  const osName = result.os.name || 'Unknown';

  // ua-parser-js reports 'mobile', 'tablet', or nothing (treated as desktop/laptop here)
  // there's no reliable way to tell a laptop apart from a desktop from a user agent string,
  // so anything that isn't flagged mobile/tablet is just labeled "desktop"
  let deviceType = 'desktop';
  if (result.device.type === 'mobile') {
    deviceType = 'mobile';
  } else if (result.device.type === 'tablet') {
    deviceType = 'tablet';
  }

  // x-forwarded-for is used when the app sits behind a proxy/load balancer,
  // falls back to the direct socket address for local/dev setups
  const forwardedFor = req.headers['x-forwarded-for'];
  const ipAddress = forwardedFor ? forwardedFor.split(',')[0].trim() : req.socket.remoteAddress;

  return { browserName, osName, deviceType, ipAddress };
}

module.exports = { getDeviceInfo };
