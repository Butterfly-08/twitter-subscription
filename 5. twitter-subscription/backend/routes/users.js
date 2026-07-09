const express = require('express');
const router = express.Router();
const { register, login, verifyLoginOtp, getNotificationPreference, updateNotificationPreference } = require('../controllers/userController');
const requireAuth = require('../middleware/requireAuth');

router.post('/register', register);
router.post('/login', login);
router.post('/verify-login-otp', verifyLoginOtp);
router.get('/:id/notification-preference', requireAuth, getNotificationPreference);
router.patch('/:id/notification-preference', requireAuth, updateNotificationPreference);

module.exports = router;
