const express = require('express');
const router = express.Router();
const requireAuth = require('../middlewares/auth');
const {
  requestLanguageChange,
  verifyLanguageChange,
  resendLanguageOtp,
  getNotificationPreference,
  updateNotificationPreference,
  guestLanguageSet
} = require('../controllers/languageController');

router.post('/guest-set', guestLanguageSet);

router.post('/request-change', requireAuth, requestLanguageChange);
router.post('/verify-change', requireAuth, verifyLanguageChange);
router.post('/resend-otp', resendLanguageOtp);

router.get('/notifications', requireAuth, getNotificationPreference);
router.patch('/notifications', requireAuth, updateNotificationPreference);

module.exports = router;
