const OtpRequest = require('../models/OtpRequest');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const generateOtp = require('../utils/generateOtp');
const { hashOtp, verifyOtp } = require('../utils/hashOtp');
const mailer = require('../config/mailer');
const smsClient = require('../config/smsProvider');
const env = require('../config/env');

const supportedLanguages = ['en', 'es', 'hi', 'pt', 'zh', 'fr'];

// Mask helper for sensitive info
const maskEmail = (email) => {
  const [name, domain] = email.split('@');
  if (name.length <= 2) return `${name[0]}***@${domain}`;
  return `${name.substring(0, 2)}***${name.substring(name.length - 1)}@${domain}`;
};

const maskPhone = (phone) => {
  if (phone.length <= 5) return '***';
  return `***${phone.slice(-4)}`;
};

const sendOtpEmail = async (email, otp, lang) => {
  const subjects = {
    en: 'Your Verification Code to Switch Language',
    es: 'Su código de verificación para cambiar de idioma',
    fr: 'Votre code de vérification pour changer de langue',
    hi: 'भाषा बदलने के लिए आपका सत्यापन कोड',
    pt: 'Seu código de verificação para alterar o idioma',
    zh: '您的更改语言验证码'
  };
  
  const subject = subjects[lang] || subjects['en'];
  const text = `You requested to change your language. Your verification code is: ${otp}\n\nThis code is valid for 5 minutes.`;

  return mailer.sendMail({
    from: env.EMAIL_FROM,
    to: email,
    subject,
    text
  });
};

const sendOtpSms = async (phone, otp, lang) => {
  const templates = {
    en: `Your OTP to change website language is ${otp}. Valid for 5 minutes.`,
    es: `Su OTP para cambiar el idioma es ${otp}. Válido por 5 minutos.`
  };
  const body = templates[lang] || templates['en'];

  return smsClient.messages.create({
    body,
    from: env.TWILIO_PHONE_NUMBER || 'TweetBox',
    to: phone
  });
};

const requestLanguageChange = async (req, res, next) => {
  try {
    const { targetLanguage } = req.body;

    if (!targetLanguage || !supportedLanguages.includes(targetLanguage)) {
      return res.status(400).json({ success: false, reason: 'INVALID_LANGUAGE', message: 'Unsupported language requested.' });
    }

    const user = req.user;
    if (user.preferredLanguage === targetLanguage) {
      return res.status(400).json({ success: false, reason: 'SAME_LANGUAGE', message: 'Language is already set to preferred.' });
    }

    // Determine channel
    const useSms = user.phone && user.phoneNotificationEnabled;
    const channel = useSms ? 'sms' : 'email';
    const destination = useSms ? user.phone : user.email;
    const maskedDestination = useSms ? maskPhone(user.phone) : maskEmail(user.email);

    // Generate OTP
    const otp = generateOtp();
    const hashed = hashOtp(otp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    const otpRequest = new OtpRequest({
      userId: user._id,
      targetLanguage,
      channel,
      destination,
      otpHash: hashed,
      expiresAt
    });

    await otpRequest.save();

    console.log(`--- [LANGUAGE SWAP OTP] Channel: ${channel}, Sent to ${destination}: ${otp} ---`);

    // Send code
    if (channel === 'sms') {
      await sendOtpSms(destination, otp, user.preferredLanguage);
    } else {
      await sendOtpEmail(destination, otp, user.preferredLanguage);
    }

    // Log Request
    await AuditLog.create({
      userId: user._id,
      action: 'LANGUAGE_CHANGE_REQUEST',
      channel,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success'
    });

    res.json({
      success: true,
      otpRequestId: otpRequest._id,
      channel,
      maskedDestination,
      expiresInSeconds: 300,
      otp // response helper for local testing
    });

  } catch (error) {
    next(error);
  }
};

const verifyLanguageChange = async (req, res, next) => {
  try {
    const { otpRequestId, otp } = req.body;

    if (!otpRequestId || !otp) {
      return res.status(400).json({ success: false, reason: 'MISSING_FIELDS', message: 'OTP Request ID and code are required.' });
    }

    const otpRequest = await OtpRequest.findById(otpRequestId);
    if (!otpRequest || otpRequest.userId.toString() !== req.user._id.toString()) {
      return res.status(400).json({ success: false, reason: 'INVALID_REQUEST', message: 'Invalid OTP Request.' });
    }

    if (otpRequest.status !== 'pending') {
      return res.status(400).json({ success: false, reason: 'ALREADY_PROCESSED', message: 'This OTP has already been checked or closed.' });
    }

    if (otpRequest.expiresAt < new Date()) {
      otpRequest.status = 'expired';
      await otpRequest.save();
      return res.status(410).json({ success: false, reason: 'OTP_EXPIRED', message: 'OTP code expired. Please request a new one.' });
    }

    if (otpRequest.attempts >= env.OTP_MAX_ATTEMPTS) {
      otpRequest.status = 'failed';
      await otpRequest.save();
      return res.status(429).json({ success: false, reason: 'MAX_ATTEMPTS_EXCEEDED', message: 'Max verification attempts exceeded.' });
    }

    const isValid = verifyOtp(otp, otpRequest.otpHash);
    
    if (isValid) {
      otpRequest.status = 'verified';
      await otpRequest.save();

      const user = await User.findById(req.user._id);
      const prevLang = user.preferredLanguage;
      user.preferredLanguage = otpRequest.targetLanguage;
      await user.save();

      // Log success audit
      await AuditLog.create({
        userId: user._id,
        action: 'LANGUAGE_CHANGE_SUCCESS',
        channel: otpRequest.channel,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        status: 'success'
      });

      res.json({
        success: true,
        preferredLanguage: user.preferredLanguage,
        message: `Language successfully changed from ${prevLang.toUpperCase()} to ${user.preferredLanguage.toUpperCase()}.`
      });

    } else {
      otpRequest.attempts += 1;
      await otpRequest.save();

      // Log failure audit
      await AuditLog.create({
        userId: req.user._id,
        action: 'LANGUAGE_CHANGE_OTP_MISMATCH',
        channel: otpRequest.channel,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        status: 'failure'
      });

      const attemptsRemaining = env.OTP_MAX_ATTEMPTS - otpRequest.attempts;
      if (attemptsRemaining <= 0) {
        otpRequest.status = 'failed';
        await otpRequest.save();
        return res.status(429).json({ success: false, reason: 'MAX_ATTEMPTS_EXCEEDED', message: 'Verification failed. Max attempts reached.' });
      }

      res.status(400).json({
        success: false,
        reason: 'INVALID_OTP',
        message: `Incorrect code. You have ${attemptsRemaining} attempt(s) remaining.`,
        attemptsRemaining
      });
    }

  } catch (error) {
    next(error);
  }
};

const getNotificationPreference = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      success: true,
      enabled: user.notificationPreference.enabled,
      keywords: user.notificationPreference.keywords,
      phone: user.phone,
      phoneNotificationEnabled: user.phoneNotificationEnabled
    });
  } catch (error) {
    next(error);
  }
};

const updateNotificationPreference = async (req, res, next) => {
  try {
    const { enabled, keywords, phone, phoneNotificationEnabled } = req.body;
    const user = await User.findById(req.user._id);

    if (enabled !== undefined) {
      user.notificationPreference.enabled = !!enabled;
    }
    
    if (keywords !== undefined) {
      user.notificationPreference.keywords = keywords;
    }

    if (phone !== undefined) {
      if (phone) {
        // Sparse check
        const existing = await User.findOne({ phone, _id: { $ne: user._id } });
        if (existing) {
          return res.status(400).json({ success: false, reason: 'PHONE_EXISTS', message: 'Phone number already registered to another user' });
        }
        user.phone = phone;
      } else {
        user.phone = undefined;
      }
    }

    if (phoneNotificationEnabled !== undefined) {
      user.phoneNotificationEnabled = !!phoneNotificationEnabled;
    }

    user.notificationPreference.updatedAt = new Date();
    await user.save();

    res.json({
      success: true,
      enabled: user.notificationPreference.enabled,
      keywords: user.notificationPreference.keywords,
      phone: user.phone,
      phoneNotificationEnabled: user.phoneNotificationEnabled,
      message: 'Preferences updated successfully.'
    });

  } catch (error) {
    next(error);
  }
};

const guestLanguageSet = async (req, res, next) => {
  try {
    const { language } = req.body;
    if (!language || !supportedLanguages.includes(language)) {
      return res.status(400).json({ success: false, reason: 'INVALID_LANGUAGE', message: 'Unsupported language requested.' });
    }
    
    res.cookie('guestLanguage', language, { maxAge: 365 * 24 * 60 * 60 * 1000 }); // 1 year cookie
    res.json({ success: true, language });
  } catch (error) {
    next(error);
  }
};

const resendLanguageOtp = async (req, res, next) => {
  try {
    const { otpRequestId } = req.body;
    
    const otpRequest = await OtpRequest.findById(otpRequestId);
    if (!otpRequest) {
      return res.status(400).json({ success: false, message: 'Invalid OTP Request' });
    }

    // Cooldown check (default 30 seconds)
    const timeSinceLastUpdate = Date.now() - otpRequest.updatedAt.getTime();
    if (timeSinceLastUpdate < 30000) {
      return res.status(429).json({ success: false, message: 'Please wait before resending.' });
    }

    if (otpRequest.resendCount >= 3) {
      return res.status(429).json({ success: false, message: 'Max resend attempts exceeded.' });
    }

    const otp = generateOtp();
    otpRequest.otpHash = hashOtp(otp);
    otpRequest.expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 mins
    otpRequest.resendCount += 1;
    await otpRequest.save();

    const user = await User.findById(otpRequest.userId);
    
    if (otpRequest.channel === 'sms') {
      await sendOtpSms(otpRequest.destination, otp, user.preferredLanguage);
    } else {
      await sendOtpEmail(otpRequest.destination, otp, user.preferredLanguage);
    }

    await AuditLog.create({
      userId: user._id,
      action: 'OTP_RESENT',
      channel: otpRequest.channel,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      status: 'success'
    });

    console.log(`--- [OTP RESENT] Sent to ${otpRequest.destination}: ${otp} ---`);

    res.status(200).json({ success: true, message: 'OTP code resent.', expiresInSeconds: 300, otp });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  requestLanguageChange,
  verifyLanguageChange,
  resendLanguageOtp,
  getNotificationPreference,
  updateNotificationPreference,
  guestLanguageSet
};
