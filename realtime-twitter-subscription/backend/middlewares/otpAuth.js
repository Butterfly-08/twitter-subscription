const { verifyOtpToken } = require('../utils/tokens');

// In-memory set to prevent double use of OTP upload tokens
const usedTokens = new Set();

const otpAuthMiddleware = (req, res, next) => {
  let token = req.headers['authorization'];
  
  if (token && token.startsWith('Bearer ')) {
    token = token.slice(7);
  } else if (req.body && req.body.otpToken) {
    token = req.body.otpToken;
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      reason: 'MISSING_OTP_TOKEN',
      message: 'OTP upload token is missing. Please verify OTP first.'
    });
  }

  if (usedTokens.has(token)) {
    return res.status(401).json({
      success: false,
      reason: 'INVALID_OTP_TOKEN',
      message: 'OTP token has already been used.'
    });
  }

  const verification = verifyOtpToken(token);
  if (!verification.valid) {
    return res.status(401).json({
      success: false,
      reason: verification.reason,
      message: 'OTP verification token is invalid or expired.'
    });
  }

  // Mark token as consumed
  usedTokens.add(token);
  setTimeout(() => {
    usedTokens.delete(token);
  }, 120000); // 2 minutes auto cleanup

  req.userEmail = verification.decoded.email;
  next();
};

module.exports = otpAuthMiddleware;
