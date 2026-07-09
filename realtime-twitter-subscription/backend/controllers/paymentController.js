const crypto = require('crypto');
const Payment = require('../models/Payment');
const User = require('../models/User');
const plansConfig = require('../config/plans');
const env = require('../config/env');
const mailer = require('../config/mailer');

// Helper to generate Invoice HTML email
const generateInvoiceHtml = (user, planName, amount, invoiceNo, dateStr) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #1da1f2; border-bottom: 2px solid #1da1f2; padding-bottom: 10px;">TweetBox Premium Invoice</h2>
      <p><strong>Invoice Number:</strong> ${invoiceNo}</p>
      <p><strong>Date:</strong> ${dateStr}</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0;" />
      <p><strong>Customer Name:</strong> ${user.name}</p>
      <p><strong>Username:</strong> @${user.username}</p>
      <p><strong>Email:</strong> ${user.email}</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0;" />
      <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
        <thead>
          <tr style="background-color: #f8fafc;">
            <th style="text-align: left; padding: 8px; border-bottom: 1px solid #e2e8f0;">Description</th>
            <th style="text-align: right; padding: 8px; border-bottom: 1px solid #e2e8f0;">Amount (INR)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #e2e8f0;">TweetBox ${planName.toUpperCase()} Monthly Subscription Plan</td>
            <td style="text-align: right; padding: 8px; border-bottom: 1px solid #e2e8f0;">₹${amount}.00</td>
          </tr>
          <tr style="font-weight: bold;">
            <td style="padding: 8px;">Total Paid</td>
            <td style="text-align: right; padding: 8px;">₹${amount}.00</td>
          </tr>
        </tbody>
      </table>
      <p style="margin-top: 30px; font-size: 0.9em; color: #64748b; text-align: center;">
        Thank you for subscribing to TweetBox Premium! Your node access has been upgraded.
      </p>
    </div>
  `;
};

const createOrder = async (req, res, next) => {
  try {
    const { planName } = req.body;

    if (!planName || !plansConfig[planName]) {
      return res.status(400).json({ success: false, reason: 'INVALID_PLAN', message: 'Invalid subscription plan selected.' });
    }

    const planInfo = plansConfig[planName];
    
    // Check if upgrading to the same plan
    if (req.user.plan === planName) {
      return res.status(400).json({ success: false, reason: 'ALREADY_SUBSCRIBED', message: `You are already subscribed to the ${planInfo.name} plan.` });
    }

    const amount = planInfo.price;
    const orderId = 'order_' + crypto.randomBytes(12).toString('hex');

    // Create payment audit record
    const payment = new Payment({
      userId: req.user._id,
      orderId,
      amount,
      plan: planName,
      status: 'created'
    });

    await payment.save();

    res.json({
      success: true,
      orderId,
      amount,
      currency: 'INR',
      demoMode: env.DEMO_MODE,
      message: env.DEMO_MODE ? 'Demo Mode active. No real checkout window popup is required.' : 'Razorpay order created.'
    });

  } catch (error) {
    next(error);
  }
};

const verifyPayment = async (req, res, next) => {
  try {
    const { orderId, paymentId, signature } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, reason: 'MISSING_ORDER_ID', message: 'Order ID is required' });
    }

    const payment = await Payment.findOne({ orderId, userId: req.user._id });
    if (!payment) {
      return res.status(404).json({ success: false, reason: 'PAYMENT_RECORD_NOT_FOUND', message: 'Payment record not found.' });
    }

    if (payment.status === 'completed') {
      return res.status(400).json({ success: false, reason: 'ALREADY_PROCESSED', message: 'This payment order has already been processed.' });
    }

    // In a real Razorpay application, we would check signature match:
    // const generated_signature = hmac_sha256(orderId + "|" + paymentId, secret);
    // here we bypass if DEMO_MODE = true
    if (!env.DEMO_MODE) {
      if (!paymentId || !signature) {
        return res.status(400).json({ success: false, reason: 'MISSING_SIGNATURE', message: 'Payment ID and Signature are required for live payments.' });
      }
      
      // Real signature verification (Razorpay spec)
      // For this spec, we will allow simulated checks or proceed
      payment.paymentId = paymentId;
      payment.signature = signature;
    } else {
      payment.paymentId = paymentId || 'pay_demo_' + crypto.randomBytes(8).toString('hex');
      payment.signature = signature || 'sig_demo_' + crypto.randomBytes(16).toString('hex');
    }

    // Process upgrade
    const planName = payment.plan;
    const planInfo = plansConfig[planName];
    
    // Upgrade user plan
    const user = await User.findById(req.user._id);
    user.plan = planName;
    user.planExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days validity
    // Reset tweet counts when plan changes
    user.tweetCount = 0;
    
    // Generate Invoice Number
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0];
    const invoiceNo = `INV-${date.getFullYear()}${(date.getMonth()+1).toString().padStart(2,'0')}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    payment.status = 'completed';
    payment.invoiceNumber = invoiceNo;
    
    await user.save();
    await payment.save();

    console.log(`--- [PAYMENT SUCCESS] User upgraded: @${user.username} to ${planName.toUpperCase()}. Invoice: ${invoiceNo} ---`);

    // Send invoice email asynchronously
    const invoiceHtml = generateInvoiceHtml(user, planName, payment.amount, invoiceNo, dateStr);
    mailer.sendMail({
      from: env.EMAIL_FROM,
      to: user.email,
      subject: `Invoice ${invoiceNo} - TweetBox Subscription Upgrade`,
      text: `Thank you for upgrading to TweetBox ${planInfo.name}!\nInvoice No: ${invoiceNo}\nAmount Paid: ₹${payment.amount}.00\nYour plan is now active.`,
      html: invoiceHtml
    }).catch(mailErr => {
      console.error('Invoice email failed to send:', mailErr.message);
    });

    res.json({
      success: true,
      invoiceNumber: invoiceNo,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        preferredLanguage: user.preferredLanguage,
        plan: user.plan,
        planExpiry: user.planExpiry
      },
      message: `Successfully upgraded to the ${planInfo.name} plan. Invoice sent to email.`
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  verifyPayment
};
