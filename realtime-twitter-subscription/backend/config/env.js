const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DB_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/realtime_twitter_db',
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_jwt_secret',
  OTP_HASH_SECRET: process.env.OTP_HASH_SECRET || 'fallback_otp_hash_secret',
  SESSION_SECRET: process.env.SESSION_SECRET || 'fallback_session_secret',
  
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.ethereal.email',
  SMTP_PORT: parseInt(process.env.SMTP_PORT, 10) || 587,
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'TweetBox Support <no-reply@example.com>',
  
  TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID || '',
  TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN || '',
  TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER || '',

  DEMO_MODE: process.env.DEMO_MODE === 'true',
  DEV_BYPASS_TIME_WINDOW: process.env.DEV_BYPASS_TIME_WINDOW === 'true',
  
  UPLOAD_WINDOW_START_IST: process.env.UPLOAD_WINDOW_START_IST || '14:00',
  UPLOAD_WINDOW_END_IST: process.env.UPLOAD_WINDOW_END_IST || '19:00',
  PAYMENT_WINDOW_START_HOUR: parseInt(process.env.PAYMENT_WINDOW_START_HOUR, 10) || 10,
  PAYMENT_WINDOW_END_HOUR: parseInt(process.env.PAYMENT_WINDOW_END_HOUR, 10) || 11,
  MOBILE_LOGIN_WINDOW_START_HOUR: parseInt(process.env.MOBILE_LOGIN_WINDOW_START_HOUR, 10) || 10,
  MOBILE_LOGIN_WINDOW_END_HOUR: parseInt(process.env.MOBILE_LOGIN_WINDOW_END_HOUR, 10) || 13,

  MAX_FILE_SIZE_MB: parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 100,
  MAX_DURATION_SECONDS: parseInt(process.env.MAX_DURATION_SECONDS, 10) || 300,

  OTP_LENGTH: 6,
  OTP_EXPIRY_SECONDS: 300,
  OTP_MAX_ATTEMPTS: 5,
};
