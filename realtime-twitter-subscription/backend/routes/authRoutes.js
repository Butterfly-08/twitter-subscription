const express = require('express');
const router = express.Router();
const requireAuth = require('../middlewares/auth');
const { authLimiter } = require('../middlewares/rateLimiter');
const {
  register,
  login,
  verifyLoginOtp,
  forgotPassword,
  getLoginHistory,
  sendUploadOtp,
  verifyUploadOtp
} = require('../controllers/authController');

router.post('/register', register);
router.post('/login', authLimiter, login);
router.post('/verify-login-otp', verifyLoginOtp);
router.post('/forgot-password', forgotPassword);
router.get('/login-history', requireAuth, getLoginHistory);

// Upload OTP send & verify
router.post('/send-otp', sendUploadOtp);
router.post('/verify-otp', verifyUploadOtp);

module.exports = router;
