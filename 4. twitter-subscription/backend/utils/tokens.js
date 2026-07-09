const jwt = require('jsonwebtoken');

const generateOtpToken = (email) => {
    return jwt.sign(
        { email, action: 'audio_upload' },
        process.env.OTP_SIGNING_SECRET,
        { expiresIn: '2m' }
    );
};

const verifyOtpToken = (token) => {
    try {
        const decoded = jwt.verify(token, process.env.OTP_SIGNING_SECRET);
        if (decoded.action !== 'audio_upload') {
            return { valid: false, reason: 'INVALID_OTP_TOKEN_ACTION' };
        }
        return { valid: true, decoded };
    } catch (err) {
        return { valid: false, reason: err.name === 'TokenExpiredError' ? 'OTP_TOKEN_EXPIRED' : 'INVALID_OTP_TOKEN' };
    }
};

module.exports = {
    generateOtpToken,
    verifyOtpToken
};
