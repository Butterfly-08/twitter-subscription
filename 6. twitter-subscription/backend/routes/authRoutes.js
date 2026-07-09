const express = require('express');
const router = express.Router();
const { mockLogin, register, verifyLoginOtp, getCsrfToken } = require('../controllers/authController');
const { csrfProtection } = require('../middlewares/csrfProtection');

router.post('/login', mockLogin);
router.post('/register', register);
router.post('/verify-login-otp', verifyLoginOtp);
router.get('/csrf-token', csrfProtection, getCsrfToken);

module.exports = router;
