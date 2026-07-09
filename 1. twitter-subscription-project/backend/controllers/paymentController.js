const crypto = require('crypto');
const moment = require('moment-timezone');
const razorpayInstance = require('../config/razorpay');
const PLANS = require('../config/plans');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { sendInvoiceEmail } = require('../utils/sendEmail');

// @desc create razorpay order for a plan
// @route POST /api/payments/create-order
const createOrder = async (req, res) => {
  try {
    const { plan } = req.body;

    if (!plan || !PLANS[plan]) {
      return res.status(400).json({ message: 'Invalid plan selected' });
    }

    if (plan === 'free') {
      return res.status(400).json({ message: 'Free plan does not require payment' });
    }

    const planDetails = PLANS[plan];
    const amountInPaise = planDetails.price * 100;

    // demo mode - no real razorpay account needed, fakes an order id locally
    // turn this off by setting DEMO_MODE=false in .env once real keys are added
    if (process.env.DEMO_MODE === 'true') {
      const fakeOrderId = `demo_order_${Date.now()}`;

      const payment = await Payment.create({
        user: req.user._id,
        plan,
        amount: planDetails.price,
        razorpayOrderId: fakeOrderId,
        status: 'created',
      });

      return res.json({
        orderId: fakeOrderId,
        amount: amountInPaise,
        currency: 'INR',
        keyId: 'demo',
        paymentRecordId: payment._id,
        planName: planDetails.name,
        demoMode: true,
      });
    }

    const options = {
      amount: amountInPaise,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpayInstance.orders.create(options);

    // save a record with status created, will update once payment verified
    const payment = await Payment.create({
      user: req.user._id,
      plan,
      amount: planDetails.price,
      razorpayOrderId: order.id,
      status: 'created',
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      paymentRecordId: payment._id,
      planName: planDetails.name,
      demoMode: false,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Something went wrong while creating order' });
  }
};

// @desc verify payment signature after checkout success, upgrade plan, send invoice mail
// @route POST /api/payments/verify
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = req.body;

    const isDemo = process.env.DEMO_MODE === 'true';

    if (!razorpay_order_id || !plan) {
      return res.status(400).json({ message: 'Missing payment details' });
    }

    if (!isDemo) {
      if (!razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ message: 'Missing payment details' });
      }

      const sign = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(sign.toString())
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ message: 'Payment verification failed, signature mismatch' });
      }
    }

    const paymentRecord = await Payment.findOne({ razorpayOrderId: razorpay_order_id });
    if (!paymentRecord) {
      return res.status(404).json({ message: 'Payment record not found' });
    }

    const invoiceNumber = `INV-${Date.now()}`;
    const fakePaymentId = isDemo ? `demo_pay_${Date.now()}` : razorpay_payment_id;

    paymentRecord.razorpayPaymentId = fakePaymentId;
    paymentRecord.razorpaySignature = isDemo ? 'demo_signature' : razorpay_signature;
    paymentRecord.status = 'paid';
    paymentRecord.invoiceNumber = invoiceNumber;
    await paymentRecord.save();

    const planDetails = PLANS[plan];
    const user = await User.findById(req.user._id);

    user.plan = plan;
    // subscription valid for 30 days from now
    user.planExpiry = moment().tz('Asia/Kolkata').add(30, 'days').toDate();
    // reset tweet count on upgrade so they get full quota right away
    user.tweetCount = 0;
    user.tweetCountMonth = `${moment().year()}-${moment().month()}`;
    await user.save();

    // send invoice email, but don't fail the whole request if email fails
    try {
      await sendInvoiceEmail({
        toEmail: user.email,
        userName: user.name,
        planName: planDetails.name,
        amount: planDetails.price,
        invoiceNumber,
        paymentId: fakePaymentId,
        date: moment().tz('Asia/Kolkata').format('DD MMM YYYY, hh:mm A'),
      });
    } catch (emailErr) {
      console.log('Email sending failed:', emailErr.message);
    }

    res.json({
      message: 'Payment verified successfully, plan upgraded',
      plan: user.plan,
      planExpiry: user.planExpiry,
      invoiceNumber,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Something went wrong while verifying payment' });
  }
};

// @desc get payment history of logged in user
// @route GET /api/payments/history
const getPaymentHistory = async (req, res) => {
  try {
    const payments = await Payment.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(payments);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Something went wrong while fetching payment history' });
  }
};

module.exports = { createOrder, verifyPayment, getPaymentHistory };
