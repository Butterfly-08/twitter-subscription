const Razorpay = require('razorpay');

// single instance reused everywhere, no point creating it again and again
// in demo mode real keys might not exist, so use placeholder values to avoid crashing on require
const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'demo_key_id',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'demo_key_secret',
});

module.exports = razorpayInstance;
