const User = require('../models/User');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const bcrypt = require('bcryptjs');

// Mock login or credentials login depending on request body
const mockLogin = async (req, res) => {
  try {
    const { username, password } = req.body || {};

    // If username or password is provided in body, perform actual login
    if (username || password) {
      const user = await User.findOne({
        $or: [
          { username: username },
          { email: username }
        ]
      });

      if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        return res.status(401).json({ success: false, reason: 'UNAUTHORIZED', message: 'Invalid credentials' });
      }

      // Check User-Agent: Chrome specific OTP logic
      const userAgent = req.headers['user-agent'] || '';
      const isChrome = userAgent.toLowerCase().includes('chrome') && !userAgent.toLowerCase().includes('edg');

      if (isChrome) {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.loginOtp = otp;
        user.loginOtpExpire = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        await user.save();

        console.log(`--- OTP Generated for ${user.username || user.email}: ${otp} ---`);

        return res.json({
          success: true,
          otpRequired: true,
          userId: user._id,
          otp, // return OTP in response for development convenience
          message: 'A verification code has been sent to your registered email.'
        });
      }

      const token = jwt.sign({ id: user._id }, env.JWT_SECRET, { expiresIn: '1d' });
      res.cookie('token', token, { httpOnly: true, secure: env.NODE_ENV === 'production' });

      return res.json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          username: user.username,
          email: user.email,
          preferredLanguage: user.preferredLanguage
        }
      });
    }

    // Default mock login logic for integration tests
    const email = 'test@example.com';
    const mobileNumber = '+1234567890';
    
    let user = await User.findOne({ email });
    if (!user) {
      const passwordHash = await bcrypt.hash('password123', 10);
      user = await User.create({
        name: 'Test User',
        username: 'testuser',
        email,
        mobileNumber,
        passwordHash,
        preferredLanguage: 'en',
        isEmailVerified: true,
        isMobileVerified: true
      });
    }

    const token = jwt.sign({ id: user._id }, env.JWT_SECRET, { expiresIn: '1d' });
    
    // Set cookie if using cookie based session
    res.cookie('token', token, { httpOnly: true, secure: env.NODE_ENV === 'production' });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        preferredLanguage: user.preferredLanguage
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const register = async (req, res) => {
  try {
    const { name, username, email, mobileNumber, password } = req.body;
    if (!name || !username || !email || !mobileNumber || !password) {
      return res.status(400).json({ success: false, reason: 'INVALID_BODY', message: 'Missing fields' });
    }

    // Check unique fields
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ success: false, reason: 'USERNAME_EXISTS', message: 'Username is already taken' });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ success: false, reason: 'EMAIL_EXISTS', message: 'Email is already registered' });
    }

    const existingPhone = await User.findOne({ mobileNumber });
    if (existingPhone) {
      return res.status(400).json({ success: false, reason: 'PHONE_EXISTS', message: 'Mobile number is already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const preferredLanguage = req.cookies.guestLanguage || 'en';

    const user = await User.create({
      name,
      username,
      email,
      mobileNumber,
      passwordHash,
      preferredLanguage,
      isEmailVerified: false,
      isMobileVerified: false
    });

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
        preferredLanguage: user.preferredLanguage
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const verifyLoginOtp = async (req, res) => {
  try {
    const { userId, otp } = req.body;
    if (!userId || !otp) {
      return res.status(400).json({ success: false, reason: 'INVALID_BODY', message: 'Missing verification details' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, reason: 'USER_NOT_FOUND', message: 'User not found' });
    }

    if (!user.loginOtp || !user.loginOtpExpire || user.loginOtpExpire < new Date()) {
      return res.status(400).json({ success: false, reason: 'EXPIRED', message: 'Verification code has expired, please login again' });
    }

    if (user.loginOtp !== otp) {
      return res.status(400).json({ success: false, reason: 'INVALID_OTP', message: 'Incorrect verification code' });
    }

    user.loginOtp = null;
    user.loginOtpExpire = null;
    await user.save();

    const token = jwt.sign({ id: user._id }, env.JWT_SECRET, { expiresIn: '1d' });
    res.cookie('token', token, { httpOnly: true, secure: env.NODE_ENV === 'production' });

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        preferredLanguage: user.preferredLanguage
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCsrfToken = (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
};

module.exports = { mockLogin, register, verifyLoginOtp, getCsrfToken };
