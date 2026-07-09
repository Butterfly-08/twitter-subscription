const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');

const requireAuth = async (req, res, next) => {
  let token = req.cookies.token;
  
  if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  if (!token) {
    return res.status(401).json({ success: false, reason: 'UNAUTHORIZED', message: 'No authentication token provided' });
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ success: false, reason: 'UNAUTHORIZED', message: 'User not found' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, reason: 'UNAUTHORIZED', message: 'Invalid or expired token' });
  }
};

module.exports = requireAuth;
