const { verifyOtpToken } = require('../utils/tokens');

// In-memory set to track used tokens and enforce single-use
const usedTokens = new Set();

const otpAuthMiddleware = (req, res, next) => {
    // Expected either in body or header. Since we use FormData, we will look in req.body first,
    // but multer parses body AFTER this middleware runs.
    // Wait, if it's multipart/form-data, req.body.otpToken won't be available here unless parsed first.
    // Therefore, the frontend MUST send it in a header or we parse the form-data first.
    // The spec says:
    // "10. The frontend immediately calls POST /api/audio-tweets/upload with:
    //  - multipart/form-data: the audio file, the tweet's optional text caption, otpToken.
    //  11. The backend runs the middleware pipeline in this order:
    //  - Verify otpToken -> consume it."
    // If we run `otpAuth` BEFORE `multer`, we can't read `req.body.otpToken`.
    // It's better for frontend to send `Authorization: Bearer <otpToken>` header. 
    // I'll support both (header and body), but for multipart we highly recommend header.
    
    let token = req.headers['authorization'];
    if (token && token.startsWith('Bearer ')) {
        token = token.slice(7);
    } else if (req.body && req.body.otpToken) {
        token = req.body.otpToken;
    } else {
        // We'll let it pass to multer if not found here, and check AGAIN after multer if needed, 
        // OR we can just instruct the frontend to use the Authorization header.
        // Let's use Authorization header for cleaner architecture before file streaming starts.
    }

    if (!token) {
        // If not in header, it might be in form-data.
        // We can attach a pre-check to req, and validate it in the controller, 
        // or we use a wrapper.
        // Let's stick to checking headers here to reject bad requests BEFORE downloading 100MB.
        return res.status(401).json({
            success: false,
            reason: 'INVALID_OTP_TOKEN',
            message: 'OTP token is missing. Please provide it in Authorization header.'
        });
    }

    if (usedTokens.has(token)) {
        return res.status(401).json({
            success: false,
            reason: 'INVALID_OTP_TOKEN',
            message: 'OTP token has already been used.'
        });
    }

    const verification = verifyOtpToken(token);
    if (!verification.valid) {
        return res.status(401).json({
            success: false,
            reason: verification.reason,
            message: 'OTP token is invalid or expired.'
        });
    }

    // Mark as used
    usedTokens.add(token);

    // Clean up usedTokens periodically? (Not strict for this spec, tokens expire in 2 min anyway, 
    // but memory leak if not cleared. Let's set a timeout to clear it after 2 mins)
    setTimeout(() => {
        usedTokens.delete(token);
    }, 2 * 60 * 1000);

    req.userEmail = verification.decoded.email;
    next();
};

module.exports = otpAuthMiddleware;
