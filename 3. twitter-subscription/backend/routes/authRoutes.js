const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  verifyLoginOtp,
  forgotPassword,
  getLoginHistory,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify-login-otp', verifyLoginOtp);
router.post('/forgot-password', forgotPassword);
router.get('/login-history', protect, getLoginHistory);

module.exports = router;
