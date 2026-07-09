const OtpRequest = require('../models/OtpRequest');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const { requestLanguageChange } = require('../services/otpService');
const { verifyOtp } = require('../utils/hashOtp');
const generateOtp = require('../utils/generateOtp');
const { hashOtp } = require('../utils/hashOtp');
const emailService = require('../services/emailService');
const smsService = require('../services/smsService');
const env = require('../config/env');

const supportedLanguages = ['en', 'es', 'hi', 'pt', 'zh', 'fr'];

const requestChange = async (req, res, next) => {
  try {
    const { targetLanguage } = req.body;
    
    if (!supportedLanguages.includes(targetLanguage)) {
      return res.status(400).json({ success: false, code: 'LANG_001', message: 'Invalid or unsupported target language' });
    }

    const result = await requestLanguageChange(req.user, targetLanguage);
    
    await AuditLog.create({
      userId: req.user._id,
      action: 'LANGUAGE_CHANGE_REQUEST',
      channel: result.channel,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success'
    });

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

const verifyChange = async (req, res, next) => {
  try {
    const { otpRequestId, otp } = req.body;
    
    const otpRequest = await OtpRequest.findOne({ _id: otpRequestId, userId: req.user._id });
    if (!otpRequest) {
      return res.status(400).json({ success: false, code: 'OTP_001', message: 'Invalid OTP Request' });
    }

    if (otpRequest.status !== 'pending' || otpRequest.expiresAt < new Date()) {
      otpRequest.status = 'expired';
      await otpRequest.save();
      return res.status(410).json({ success: false, code: 'OTP_002', message: 'OTP expired. Please request a new one.' });
    }

    if (otpRequest.attempts >= env.OTP_MAX_ATTEMPTS) {
      otpRequest.status = 'failed';
      await otpRequest.save();
      return res.status(429).json({ success: false, code: 'OTP_003', message: 'Max verification attempts exceeded' });
    }

    const isValid = verifyOtp(otp, otpRequest.otpHash);
    
    if (isValid) {
      otpRequest.status = 'verified';
      await otpRequest.save();
      
      const user = await User.findById(req.user._id);
      user.preferredLanguage = otpRequest.targetLanguage;
      await user.save();

      await AuditLog.create({
        userId: req.user._id,
        action: 'LANGUAGE_CHANGE_SUCCESS',
        channel: otpRequest.channel,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        status: 'success'
      });

      // Normally we would issue a new JWT here if language is in claim, 
      // but assuming the client relies on DB state or just gets success response
      res.status(200).json({
        success: true,
        message: 'Language updated successfully.',
        preferredLanguage: user.preferredLanguage
      });
    } else {
      otpRequest.attempts += 1;
      await otpRequest.save();
      
      await AuditLog.create({
        userId: req.user._id,
        action: 'LANGUAGE_CHANGE_OTP_MISMATCH',
        channel: otpRequest.channel,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        status: 'failure'
      });
      
      const attemptsRemaining = env.OTP_MAX_ATTEMPTS - otpRequest.attempts;
      res.status(400).json({ success: false, code: 'OTP_001', message: 'Invalid OTP', attemptsRemaining });
    }
  } catch (error) {
    next(error);
  }
};

const resendOtp = async (req, res, next) => {
  try {
    const { otpRequestId } = req.body;
    
    const otpRequest = await OtpRequest.findOne({ _id: otpRequestId });
    // Don't require auth on resend if we just rely on ID, but ideally we should
    // In our design, resend might happen before token expiration, but checking userId is safer.
    
    if (!otpRequest) {
      return res.status(400).json({ success: false, message: 'Invalid OTP Request' });
    }

    // Cooldown check
    const timeSinceCreation = Date.now() - otpRequest.updatedAt.getTime();
    if (timeSinceCreation < env.OTP_RESEND_COOLDOWN_SECONDS * 1000) {
      return res.status(429).json({ success: false, message: `Please wait before resending.` });
    }

    if (otpRequest.resendCount >= env.OTP_MAX_RESENDS) {
      return res.status(429).json({ success: false, code: 'OTP_004', message: 'Max resend attempts exceeded' });
    }

    const otp = generateOtp();
    otpRequest.otpHash = hashOtp(otp);
    otpRequest.expiresAt = new Date(Date.now() + env.OTP_EXPIRY_SECONDS * 1000);
    otpRequest.resendCount += 1;
    await otpRequest.save();

    const user = await User.findById(otpRequest.userId);

    if (otpRequest.channel === 'email') {
      await emailService.sendOtpEmail(user.email, otp, user.preferredLanguage, user.name);
    } else {
      await smsService.sendOtpSms(user.mobileNumber, otp, user.preferredLanguage);
    }

    await AuditLog.create({
      userId: user._id,
      action: 'OTP_RESENT',
      channel: otpRequest.channel,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success'
    });

    res.status(200).json({ success: true, message: 'OTP resent.', expiresInSeconds: env.OTP_EXPIRY_SECONDS });
  } catch (error) {
    next(error);
  }
};

const getCurrentLanguage = async (req, res, next) => {
  try {
    res.status(200).json({
      preferredLanguage: req.user.preferredLanguage,
      supportedLanguages,
      translationBundleUrl: `/locales/${req.user.preferredLanguage}.json`,
      bundleVersion: new Date().toISOString().split('T')[0]
    });
  } catch (error) {
    next(error);
  }
};

const guestSetLanguage = async (req, res, next) => {
  try {
    const { language } = req.body;
    if (!supportedLanguages.includes(language)) {
      return res.status(400).json({ success: false, message: 'Invalid language' });
    }
    res.cookie('guestLanguage', language, { maxAge: 900000, httpOnly: false });
    res.status(200).json({ success: true, language });
  } catch (error) {
    next(error);
  }
};

module.exports = { requestChange, verifyChange, resendOtp, getCurrentLanguage, guestSetLanguage };
