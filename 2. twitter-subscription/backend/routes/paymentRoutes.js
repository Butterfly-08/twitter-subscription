const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment, getPaymentHistory } = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');
const { checkPaymentWindow } = require('../middleware/paymentWindow');

// time restriction applied only on actual money routes, not on history
router.post('/create-order', protect, checkPaymentWindow, createOrder);
router.post('/verify', protect, checkPaymentWindow, verifyPayment);
router.get('/history', protect, getPaymentHistory);

module.exports = router;
