const multer = require('multer');
const path = require('path');
const fs = require('fs');
const env = require('../config/env');

const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'audio-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/') || /\.(mp3|wav|m4a|ogg|webm)$/i.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only audio files are allowed.'), false);
    }
  }
}).single('audioFile');

const uploadMiddleware = (req, res, next) => {
  upload(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            reason: 'FILE_TOO_LARGE',
            message: `File size exceeds the limit of ${env.MAX_FILE_SIZE_MB}MB.`
          });
        }
      }
      return res.status(400).json({
        success: false,
        reason: 'UPLOAD_ERROR',
        message: err.message
      });
    }
    next();
  });
};

module.exports = uploadMiddleware;
