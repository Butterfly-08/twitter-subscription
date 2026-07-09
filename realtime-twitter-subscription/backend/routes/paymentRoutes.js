const express = require('express');
const router = express.Router();
const requireAuth = require('../middlewares/auth');
const paymentWindowMiddleware = require('../middlewares/paymentWindow');
const { createOrder, verifyPayment } = require('../controllers/paymentController');

// All payment requests require authentication and must fall in the time window
router.post('/create-order', requireAuth, paymentWindowMiddleware, createOrder);
router.post('/verify-payment', requireAuth, paymentWindowMiddleware, verifyPayment);

module.exports = router;
