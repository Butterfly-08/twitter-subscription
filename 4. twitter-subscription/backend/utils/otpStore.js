const crypto = require('crypto');

// In-memory OTP store for simplicity as per spec
// store[email] = { hash, expiresAt, attempts }
const otpStore = {};

const generateOtp = () => {
    return crypto.randomInt(0, 1000000).toString().padStart(6, '0');
};

const hashOtp = (otp, email) => {
    return crypto.createHash('sha256').update(`${email}:${otp}`).digest('hex');
};

const saveOtp = (email, otp) => {
    const hash = hashOtp(otp, email);
    otpStore[email] = {
        hash,
        expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
        attempts: 0
    };
};

const verifyOtp = (email, otp) => {
    const record = otpStore[email];
    if (!record) {
        return { success: false, reason: 'INVALID_OTP', message: 'No OTP requested or expired.' };
    }

    if (Date.now() > record.expiresAt) {
        delete otpStore[email];
        return { success: false, reason: 'OTP_EXPIRED', message: 'OTP has expired. Please request a new one.' };
    }

    if (record.attempts >= 5) {
        delete otpStore[email];
        return { success: false, reason: 'TOO_MANY_ATTEMPTS', message: 'Too many failed attempts. Please request a new OTP.' };
    }

    const hash = hashOtp(otp, email);
    if (record.hash !== hash) {
        record.attempts += 1;
        return { success: false, reason: 'INVALID_OTP', message: `Incorrect code. ${5 - record.attempts} attempts remaining.` };
    }

    // Success, delete OTP
    delete otpStore[email];
    return { success: true };
};

// Simple rate limiter for sending OTP
const rateLimits = {};
const checkRateLimit = (email) => {
    const now = Date.now();
    const windowMs = 15 * 60 * 1000;
    
    if (!rateLimits[email]) {
        rateLimits[email] = [];
    }
    
    // Filter out old requests
    rateLimits[email] = rateLimits[email].filter(time => now - time < windowMs);
    
    if (rateLimits[email].length >= 3) {
        return false;
    }
    
    rateLimits[email].push(now);
    return true;
};

module.exports = {
    generateOtp,
    saveOtp,
    verifyOtp,
    checkRateLimit
};
