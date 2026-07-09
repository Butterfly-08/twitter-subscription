const OtpRequest = require('../models/OtpRequest');
const generateOtp = require('../utils/generateOtp');
const { hashOtp } = require('../utils/hashOtp');
const env = require('../config/env');
const emailService = require('./emailService');
const smsService = require('./smsService');
const { maskEmail, maskMobile } = require('../utils/maskContact');

const requestLanguageChange = async (user, targetLanguage) => {
  let channel = 'sms';
  let destination = user.mobileNumber;

  if (targetLanguage === 'fr') {
    channel = 'email';
    destination = user.email;
  }

  const otp = generateOtp();
  const hashed = hashOtp(otp);
  const expiresAt = new Date(Date.now() + env.OTP_EXPIRY_SECONDS * 1000);

  const otpRequest = new OtpRequest({
    userId: user._id,
    channel,
    targetLanguage,
    otpHash: hashed,
    destination,
    expiresAt,
  });

  await otpRequest.save();

  // Dispatch OTP
  if (channel === 'email') {
    await emailService.sendOtpEmail(user.email, otp, user.preferredLanguage, user.name);
  } else {
    await smsService.sendOtpSms(user.mobileNumber, otp, user.preferredLanguage);
  }

  const maskedDestination = channel === 'email' ? maskEmail(destination) : maskMobile(destination);

  return {
    otpRequestId: otpRequest._id,
    channel,
    maskedDestination,
    expiresInSeconds: env.OTP_EXPIRY_SECONDS
  };
};

module.exports = { requestLanguageChange };
