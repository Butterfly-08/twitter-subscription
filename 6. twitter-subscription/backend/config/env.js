const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DB_URI: process.env.DB_URI || 'mongodb://localhost:27017/multilang_app',
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_jwt_secret',
  OTP_HASH_SECRET: process.env.OTP_HASH_SECRET || 'fallback_otp_hash_secret',
  SESSION_SECRET: process.env.SESSION_SECRET || 'fallback_session_secret',
  
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.ethereal.email',
  SMTP_PORT: process.env.SMTP_PORT || 587,
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'MyApp Support <no-reply@example.com>',
  
  SMS_PROVIDER_API_KEY: process.env.SMS_PROVIDER_API_KEY || '',
  SMS_PROVIDER_SENDER_ID: process.env.SMS_PROVIDER_SENDER_ID || 'MYAPP',
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || '',

  OTP_LENGTH: parseInt(process.env.OTP_LENGTH, 10) || 6,
  OTP_EXPIRY_SECONDS: parseInt(process.env.OTP_EXPIRY_SECONDS, 10) || 300,
  OTP_MAX_ATTEMPTS: parseInt(process.env.OTP_MAX_ATTEMPTS, 10) || 5,
  OTP_RESEND_COOLDOWN_SECONDS: parseInt(process.env.OTP_RESEND_COOLDOWN_SECONDS, 10) || 30,
  OTP_MAX_RESENDS: parseInt(process.env.OTP_MAX_RESENDS, 10) || 3,

  RATE_LIMIT_WINDOW_MINUTES: parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES, 10) || 15,
  RATE_LIMIT_MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 10,
};
