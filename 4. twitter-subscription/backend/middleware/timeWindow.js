const isWithinUploadWindow = (date = new Date()) => {
    // If dev bypass is enabled, always return true
    if (process.env.DEV_BYPASS_TIME_WINDOW === 'true') {
        return true;
    }

    const istOffsetMinutes = 5 * 60 + 30; // UTC+5:30
    const utcMinutes = date.getUTCHours() * 60 + date.getUTCMinutes();
    const istMinutes = (utcMinutes + istOffsetMinutes) % (24 * 60);

    const startParts = (process.env.UPLOAD_WINDOW_START_IST || '14:00').split(':');
    const endParts = (process.env.UPLOAD_WINDOW_END_IST || '19:00').split(':');

    const windowStart = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
    const windowEnd = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);

    return istMinutes >= windowStart && istMinutes < windowEnd;
};

const computeNextWindowOpenIso = () => {
    const now = new Date();
    const istOffsetMs = (5 * 60 + 30) * 60 * 1000;
    
    // Convert current UTC time to IST
    const istDate = new Date(now.getTime() + istOffsetMs);
    
    const startParts = (process.env.UPLOAD_WINDOW_START_IST || '14:00').split(':');
    const startHour = parseInt(startParts[0]);
    const startMin = parseInt(startParts[1]);

    let targetDate = new Date(istDate);
    targetDate.setUTCHours(startHour, startMin, 0, 0);

    // If we've passed today's window start, the next open is tomorrow
    if (istDate.getTime() > targetDate.getTime()) {
        targetDate.setUTCDate(targetDate.getUTCDate() + 1);
    }

    // Convert back from target IST date to real UTC date string
    const nextOpenUTC = new Date(targetDate.getTime() - istOffsetMs);
    return nextOpenUTC.toISOString();
};

const computeWindowStatus = () => {
    const now = new Date();
    const istOffsetMs = (5 * 60 + 30) * 60 * 1000;
    const istDate = new Date(now.getTime() + istOffsetMs);
    const isoStringIST = istDate.toISOString().replace('Z', '+05:30'); // roughly representing IST locally

    const startParts = (process.env.UPLOAD_WINDOW_START_IST || '14:00').split(':');
    const endParts = (process.env.UPLOAD_WINDOW_END_IST || '19:00').split(':');

    const startHour = parseInt(startParts[0]);
    const startMin = parseInt(startParts[1]);
    const endHour = parseInt(endParts[0]);
    const endMin = parseInt(endParts[1]);

    let targetDate = new Date(istDate);

    const isOpen = isWithinUploadWindow(now);

    let closesInSeconds = 0;
    if (isOpen) {
        targetDate.setUTCHours(endHour, endMin, 0, 0);
        closesInSeconds = Math.max(0, Math.floor((targetDate.getTime() - istDate.getTime()) / 1000));
    }

    return {
        windowOpen: isOpen,
        currentTimeIST: isoStringIST,
        windowOpensAt: process.env.UPLOAD_WINDOW_START_IST || '14:00:00',
        windowClosesAt: process.env.UPLOAD_WINDOW_END_IST || '19:00:00',
        closesInSeconds: closesInSeconds
    };
};

const timeWindowMiddleware = (req, res, next) => {
    if (!isWithinUploadWindow()) {
        return res.status(403).json({
            success: false,
            reason: 'OUTSIDE_UPLOAD_WINDOW',
            message: 'Audio tweets can only be posted between 2:00 PM and 7:00 PM IST.',
            nextWindowOpensAt: computeNextWindowOpenIso()
        });
    }
    next();
};

module.exports = {
    timeWindowMiddleware,
    computeWindowStatus
};
