const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    let token;
    
    // Check header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } 
    // Check cookies as fallback (if we use cookie based jwt)
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ success: false, code: 'AUTH_001', message: 'Not authorized, no token' });
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-passwordHash');
    
    if (!req.user) {
      return res.status(401).json({ success: false, code: 'AUTH_001', message: 'Not authorized, user not found' });
    }
    
    next();
  } catch (error) {
    console.error(error);
    return res.status(401).json({ success: false, code: 'AUTH_001', message: 'Not authorized, token failed' });
  }
};

module.exports = { authMiddleware };
