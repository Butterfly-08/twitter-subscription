const UAParser = require('ua-parser-js');

const detectDevice = (userAgentString) => {
  const parser = new UAParser(userAgentString);
  const result = parser.getResult();
  
  const browser = result.browser.name || 'Unknown';
  const os = result.os.name || 'Unknown';
  let deviceType = result.device.type || 'desktop'; // desktop, mobile, tablet
  
  return {
    browser,
    os,
    deviceType
  };
};

module.exports = detectDevice;
