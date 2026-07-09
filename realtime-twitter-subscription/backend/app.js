const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const env = require('./config/env');
const { errorHandler } = require('./middlewares/errorHandler');

const authRoutes = require('./routes/authRoutes');
const tweetRoutes = require('./routes/tweetRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const languageRoutes = require('./routes/languageRoutes');

const app = express();

// Security Middlewares (Note: We bypass contentSecurityPolicy block on media files in dev)
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: false
}));

app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Sessions configuration
app.use(session({
  secret: env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: env.NODE_ENV === 'production' }
}));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// Serve audio uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tweets', tweetRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/language', languageRoutes);

// Catch 404 for API, otherwise redirect to index.html for SPA frontend routing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ success: false, message: 'API Endpoint not found.' });
  }
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Error handling middleware
app.use(errorHandler);

module.exports = app;
