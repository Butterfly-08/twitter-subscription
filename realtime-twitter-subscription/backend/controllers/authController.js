const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const LoginHistory = require('../models/LoginHistory');
const env = require('../config/env');
const detectDevice = require('../utils/deviceDetect');
const { isWithinMobileLoginWindow } = require('../utils/mobileLoginWindow');
const generateOtp = require('../utils/generateOtp');
const { hashOtp, verifyOtp } = require('../utils/hashOtp');
const { generateRandomLettersPassword } = require('../utils/passwordGenerator');
const { generateOtpToken } = require('../utils/tokens');
const mailer = require('../config/mailer');

// Temporary in-memory stores for OTP verification for uploads
const uploadOtps = new Map(); 
const uploadOtpAttempts = new Map();

// Helper to send registration/verification emails
const sendOtpEmail = async (email, otp, subjectText) => {
  const mailOptions = {
    from: env.EMAIL_FROM,
    to: email,
    subject: subjectText || 'Your Security OTP Code',
    text: `Your Security Verification Code is: ${otp}\n\nThis code is valid for 5 minutes.\nIf you did not request this code, please secure your account.`
  };
  return mailer.sendMail(mailOptions);
};

const register = async (req, res, next) => {
  try {
    const { name, username, email, phone, password, preferredLanguage } = req.body;
    
    if (!name || !username || !email || !password) {
      return res.status(400).json({ success: false, reason: 'MISSING_FIELDS', message: 'All fields are required' });
    }

    const emailExists = await User.findOne({ email: email.toLowerCase() });
    if (emailExists) {
      return res.status(400).json({ success: false, reason: 'EMAIL_EXISTS', message: 'Email is already registered' });
    }

    const usernameExists = await User.findOne({ username: username.toLowerCase() });
    if (usernameExists) {
      return res.status(400).json({ success: false, reason: 'USERNAME_EXISTS', message: 'Username is already taken' });
    }

    if (phone) {
      const phoneExists = await User.findOne({ phone });
      if (phoneExists) {
        return res.status(400).json({ success: false, reason: 'PHONE_EXISTS', message: 'Phone number is already registered' });
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    const user = new User({
      name,
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      phone: phone || undefined,
      passwordHash,
      preferredLanguage: preferredLanguage || 'en'
    });

    await user.save();

    const token = jwt.sign({ id: user._id }, env.JWT_SECRET, { expiresIn: '1d' });
    res.cookie('token', token, { httpOnly: true, secure: env.NODE_ENV === 'production' });

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        phone: user.phone,
        preferredLanguage: user.preferredLanguage,
        plan: user.plan
      }
    });

  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, reason: 'MISSING_FIELDS', message: 'Username and password are required' });
    }

    // 1. Mobile Login restrictions check
    const userAgentStr = req.headers['user-agent'] || '';
    const deviceDetails = detectDevice(userAgentStr);
    
    if (deviceDetails.deviceType === 'mobile') {
      if (!isWithinMobileLoginWindow()) {
        const start = env.MOBILE_LOGIN_WINDOW_START_HOUR;
        const end = env.MOBILE_LOGIN_WINDOW_END_HOUR;
        return res.status(403).json({
          success: false,
          reason: 'MOBILE_LOGIN_WINDOW_CLOSED',
          message: `Mobile logins are restricted to the ${start}:00 AM - ${end}:00 PM IST time window.`
        });
      }
    }

    // 2. Validate credentials
    const user = await User.findOne({
      $or: [
        { username: username.toLowerCase() },
        { email: username.toLowerCase() }
      ]
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ success: false, reason: 'INVALID_CREDENTIALS', message: 'Invalid username/email or password' });
    }

    // 3. Chrome specific OTP logic
    const isChrome = deviceDetails.browser.toLowerCase().includes('chrome') && 
                     !deviceDetails.browser.toLowerCase().includes('edg') && 
                     !deviceDetails.browser.toLowerCase().includes('edge');

    if (isChrome) {
      const otp = generateOtp();
      user.loginOtp = otp;
      user.loginOtpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 mins
      await user.save();

      console.log(`--- OTP Generated for Chrome User (${user.username}): ${otp} ---`);
      
      // Log login history as pending
      await LoginHistory.create({
        userId: user._id,
        ipAddress: req.ip,
        browser: deviceDetails.browser,
        os: deviceDetails.os,
        deviceType: deviceDetails.deviceType,
        userAgent: userAgentStr,
        status: 'otp_pending'
      });

      // Send via email
      await sendOtpEmail(user.email, otp, 'Secure Login Verification Code');

      return res.json({
        success: true,
        otpRequired: true,
        userId: user._id,
        otp, // response verification helper for local testing
        message: 'Google Chrome detected. A verification code has been sent to your email.'
      });
    }

    // 4. Successful non-Chrome login
    const token = jwt.sign({ id: user._id }, env.JWT_SECRET, { expiresIn: '1d' });
    res.cookie('token', token, { httpOnly: true, secure: env.NODE_ENV === 'production' });

    // Log success login history
    await LoginHistory.create({
      userId: user._id,
      ipAddress: req.ip,
      browser: deviceDetails.browser,
      os: deviceDetails.os,
      deviceType: deviceDetails.deviceType,
      userAgent: userAgentStr,
      status: 'success'
    });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        phone: user.phone,
        preferredLanguage: user.preferredLanguage,
        plan: user.plan
      }
    });

  } catch (error) {
    next(error);
  }
};

const verifyLoginOtp = async (req, res, next) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({ success: false, reason: 'MISSING_FIELDS', message: 'User ID and OTP are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, reason: 'USER_NOT_FOUND', message: 'User not found' });
    }

    if (!user.loginOtp || !user.loginOtpExpire || user.loginOtpExpire < new Date()) {
      return res.status(410).json({ success: false, reason: 'OTP_EXPIRED', message: 'OTP has expired. Please log in again.' });
    }

    if (user.loginOtp !== otp) {
      return res.status(400).json({ success: false, reason: 'INVALID_OTP', message: 'Invalid verification code' });
    }

    // OTP Verified, clear model fields
    user.loginOtp = null;
    user.loginOtpExpire = null;
    await user.save();

    // Create token
    const token = jwt.sign({ id: user._id }, env.JWT_SECRET, { expiresIn: '1d' });
    res.cookie('token', token, { httpOnly: true, secure: env.NODE_ENV === 'production' });

    // Update login history from pending to success
    const pendingLog = await LoginHistory.findOne({ userId: user._id, status: 'otp_pending' }).sort({ createdAt: -1 });
    if (pendingLog) {
      pendingLog.status = 'success';
      await pendingLog.save();
    }

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        phone: user.phone,
        preferredLanguage: user.preferredLanguage,
        plan: user.plan
      }
    });

  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { identifier } = req.body;

    if (!identifier) {
      return res.status(400).json({ success: false, reason: 'MISSING_IDENTIFIER', message: 'Email or Phone Number is required' });
    }

    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { phone: identifier }
      ]
    });

    if (!user) {
      return res.status(404).json({ success: false, reason: 'USER_NOT_FOUND', message: 'No registered user matches that identifier.' });
    }

    // Rate Limit: Once per 24 hours (1 day)
    const lastReset = user.lastPasswordResetRequest;
    if (lastReset) {
      const msSinceLast = Date.now() - new Date(lastReset).getTime();
      const oneDayMs = 24 * 60 * 60 * 1000;
      if (msSinceLast < oneDayMs) {
        return res.status(429).json({
          success: false,
          reason: 'RESET_RATE_LIMITED',
          message: 'You can use this option only one time per day.'
        });
      }
    }

    // Generate random letters-only password
    const newPassword = generateRandomLettersPassword(10);
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    user.passwordHash = passwordHash;
    user.lastPasswordResetRequest = new Date();
    await user.save();

    console.log(`--- [FORGOT PASSWORD] New password generated for user ${user.username}: ${newPassword} ---`);

    // Send email with new password
    const emailSent = await sendOtpEmail(
      user.email,
      newPassword,
      'Your New Temp Password Node'
    );

    res.json({
      success: true,
      message: 'A letters-only temporary password has been sent to your registered email.'
    });

  } catch (error) {
    next(error);
  }
};

const getLoginHistory = async (req, res, next) => {
  try {
    const history = await LoginHistory.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      history
    });
  } catch (error) {
    next(error);
  }
};

// Upload OTP flow
const sendUploadOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, reason: 'MISSING_EMAIL', message: 'Email is required' });
    }

    // Limit requests slightly
    const recentRequest = uploadOtps.get(email);
    if (recentRequest && (Date.now() - recentRequest.timestamp < 30 * 1000)) {
      return res.status(429).json({ success: false, reason: 'OTP_COOLDOWN', message: 'Please wait 30 seconds before requesting another code.' });
    }

    const otp = generateOtp();
    const expiry = Date.now() + 5 * 60 * 1000; // 5 minutes
    
    uploadOtps.set(email, {
      otp: hashOtp(otp),
      expiresAt: expiry
    });
    uploadOtpAttempts.set(email, 0);

    console.log(`--- [UPLOAD OTP] Sent to ${email}: ${otp} ---`);

    await sendOtpEmail(email, otp, 'Your Audio Tweet Upload Verification Code');

    res.json({
      success: true,
      message: 'Verification code sent to your email.',
      otp: (!env.SMTP_USER) ? otp : undefined
    });
  } catch (error) {
    next(error);
  }
};

const verifyUploadOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, reason: 'MISSING_FIELDS', message: 'Email and verification code are required' });
    }

    const record = uploadOtps.get(email);
    if (!record || record.expiresAt < Date.now()) {
      uploadOtps.delete(email);
      return res.status(410).json({ success: false, reason: 'OTP_EXPIRED', message: 'Verification code expired or not found. Please request a new one.' });
    }

    const attempts = uploadOtpAttempts.get(email) || 0;
    if (attempts >= env.OTP_MAX_ATTEMPTS) {
      uploadOtps.delete(email);
      return res.status(429).json({ success: false, reason: 'MAX_ATTEMPTS_EXCEEDED', message: 'Too many incorrect attempts. Please request a new code.' });
    }

    const isValid = verifyOtp(otp, record.otp);
    if (!isValid) {
      uploadOtpAttempts.set(email, attempts + 1);
      const attemptsRemaining = env.OTP_MAX_ATTEMPTS - (attempts + 1);
      return res.status(400).json({
        success: false,
        reason: 'INVALID_OTP',
        message: `Invalid verification code. ${attemptsRemaining} attempt(s) remaining.`,
        attemptsRemaining
      });
    }

    // Success: issue temporary otpToken for audio upload
    const otpToken = generateOtpToken(email);

    // Clean up OTP record
    uploadOtps.delete(email);
    uploadOtpAttempts.delete(email);

    res.json({
      success: true,
      otpToken,
      expiresInSeconds: 120
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  verifyLoginOtp,
  forgotPassword,
  getLoginHistory,
  sendUploadOtp,
  verifyUploadOtp
};
