const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Basic register (for testing)
async function register(req, res) {
  try {
    const { username, email, password, phone, phoneNotificationEnabled } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, reason: 'INVALID_BODY', message: 'Missing fields' });
    }

    if (phone) {
      const existingPhone = await User.findOne({ phone });
      if (existingPhone) {
        return res.status(400).json({ success: false, reason: 'PHONE_EXISTS', message: 'User already exists with this phone number' });
      }
    }
    
    // In a real app, hash the password. Storing plaintext for demo simplicity.
    const user = new User({ 
      username, 
      email, 
      passwordHash: password,
      phone: phone || undefined,
      phoneNotificationEnabled: !!phoneNotificationEnabled
    });
    await user.save();
    
    const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET);
    res.status(201).json({ success: true, token, user: { id: user._id, username, email } });
  } catch (err) {
    res.status(500).json({ success: false, reason: 'SERVER_ERROR', message: err.message });
  }
}

// Basic login
async function login(req, res) {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || user.passwordHash !== password) {
      return res.status(401).json({ success: false, reason: 'UNAUTHORIZED', message: 'Invalid credentials' });
    }

    const userAgent = req.headers['user-agent'] || '';
    const isChrome = userAgent.toLowerCase().includes('chrome') && !userAgent.toLowerCase().includes('edg');

    if (isChrome) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      user.loginOtp = otp;
      user.loginOtpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
      await user.save();

      console.log(`--- OTP Generated for ${user.username}: ${otp} ---`);

      return res.json({
        success: true,
        otpRequired: true,
        userId: user._id,
        otp, // return OTP in response for development convenience
        message: 'A verification code has been sent to your registered email.'
      });
    }

    const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET);
    res.json({ success: true, token, user: { id: user._id, username: user.username } });
  } catch (err) {
    res.status(500).json({ success: false, reason: 'SERVER_ERROR', message: err.message });
  }
}

// Get preference
async function getNotificationPreference(req, res) {
  try {
    const { id } = req.params;
    if (req.user.id !== id) {
      return res.status(403).json({ success: false, reason: 'FORBIDDEN', message: 'Cannot read another user preference' });
    }
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, reason: 'USER_NOT_FOUND', message: 'User not found' });
    }
    res.json({ 
      success: true, 
      enabled: user.notificationPreference.enabled, 
      phone: user.phone,
      phoneNotificationEnabled: user.phoneNotificationEnabled,
      updatedAt: user.notificationPreference.updatedAt 
    });
  } catch (err) {
    res.status(500).json({ success: false, reason: 'SERVER_ERROR', message: err.message });
  }
}

// Update preference
async function updateNotificationPreference(req, res) {
  try {
    const { id } = req.params;
    if (req.user.id !== id) {
      return res.status(403).json({ success: false, reason: 'FORBIDDEN', message: 'Cannot edit another user preference' });
    }
    const { enabled, phone, phoneNotificationEnabled } = req.body;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, reason: 'USER_NOT_FOUND', message: 'User not found' });
    }

    if (enabled !== undefined) {
      if (typeof enabled !== 'boolean') {
        return res.status(400).json({ success: false, reason: 'INVALID_BODY', message: 'Enabled must be a boolean' });
      }
      user.notificationPreference.enabled = enabled;
      user.notificationPreference.updatedAt = new Date();
    }

    if (phone !== undefined) {
      if (phone) {
        const existingPhone = await User.findOne({ phone, _id: { $ne: user._id } });
        if (existingPhone) {
          return res.status(400).json({ success: false, reason: 'PHONE_EXISTS', message: 'User already exists with this phone number' });
        }
      }
      user.phone = phone || undefined;
    }

    if (phoneNotificationEnabled !== undefined) {
      if (typeof phoneNotificationEnabled !== 'boolean') {
        return res.status(400).json({ success: false, reason: 'INVALID_BODY', message: 'phoneNotificationEnabled must be a boolean' });
      }
      user.phoneNotificationEnabled = phoneNotificationEnabled;
    }
    
    await user.save();
    
    res.json({ 
      success: true, 
      enabled: user.notificationPreference.enabled, 
      phone: user.phone,
      phoneNotificationEnabled: user.phoneNotificationEnabled,
      updatedAt: user.notificationPreference.updatedAt 
    });
  } catch (err) {
    res.status(500).json({ success: false, reason: 'SERVER_ERROR', message: err.message });
  }
}

async function verifyLoginOtp(req, res) {
  try {
    const { userId, otp } = req.body;
    if (!userId || !otp) {
      return res.status(400).json({ success: false, reason: 'INVALID_BODY', message: 'Missing verification details' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, reason: 'USER_NOT_FOUND', message: 'User not found' });
    }

    if (!user.loginOtp || !user.loginOtpExpire || user.loginOtpExpire < Date.now()) {
      return res.status(400).json({ success: false, reason: 'EXPIRED', message: 'Verification code has expired, please login again' });
    }

    if (user.loginOtp !== otp) {
      return res.status(400).json({ success: false, reason: 'INVALID_OTP', message: 'Incorrect verification code' });
    }

    user.loginOtp = null;
    user.loginOtpExpire = null;
    await user.save();

    const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET);
    res.json({ success: true, token, user: { id: user._id, username: user.username } });
  } catch (err) {
    res.status(500).json({ success: false, reason: 'SERVER_ERROR', message: err.message });
  }
}

module.exports = { register, login, verifyLoginOtp, getNotificationPreference, updateNotificationPreference };
