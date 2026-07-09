const express = require('express');
const router = express.Router();
const { requestChange, verifyChange, resendOtp, getCurrentLanguage, guestSetLanguage } = require('../controllers/languageController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { otpRateLimiter } = require('../middlewares/rateLimiter');
const { csrfProtection } = require('../middlewares/csrfProtection');

// Use CSRF on all POST routes, authMiddleware where needed
router.post('/request-change', authMiddleware, csrfProtection, otpRateLimiter, requestChange);
router.post('/verify-change', authMiddleware, csrfProtection, otpRateLimiter, verifyChange);
router.post('/resend-otp', csrfProtection, otpRateLimiter, resendOtp); // Removed authMiddleware strictly, but relies on valid otpRequestId
router.get('/current', authMiddleware, getCurrentLanguage);
router.post('/guest-set', csrfProtection, guestSetLanguage);

module.exports = router;
