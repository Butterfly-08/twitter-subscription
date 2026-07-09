const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}-${uuidv4()}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/x-m4a', 'audio/aac'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('UNSUPPORTED_FORMAT'), false);
    }
};

const maxSize = (process.env.MAX_FILE_SIZE_MB || 100) * 1024 * 1024;

const upload = multer({
    storage: storage,
    limits: { fileSize: maxSize },
    fileFilter: fileFilter
});

const uploadMiddleware = (req, res, next) => {
    upload.single('audio')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(413).json({
                    success: false,
                    reason: 'FILE_TOO_LARGE',
                    message: `File exceeds the maximum limit of ${process.env.MAX_FILE_SIZE_MB || 100} MB.`
                });
            }
            return res.status(400).json({ success: false, reason: 'UPLOAD_ERROR', message: err.message });
        } else if (err) {
            if (err.message === 'UNSUPPORTED_FORMAT') {
                return res.status(422).json({
                    success: false,
                    reason: 'UNSUPPORTED_FORMAT',
                    message: 'Only audio files are allowed.'
                });
            }
            return res.status(400).json({ success: false, reason: 'UPLOAD_ERROR', message: err.message });
        }
        
        if (!req.file) {
            return res.status(400).json({ success: false, reason: 'MISSING_FILE', message: 'Audio file is required.' });
        }
        
        next();
    });
};

module.exports = uploadMiddleware;
