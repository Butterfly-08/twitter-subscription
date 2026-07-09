const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const { errorHandler } = require('./middlewares/errorHandler');

const authRoutes = require('./routes/authRoutes');
const languageRoutes = require('./routes/languageRoutes');
const env = require('./config/env');

const app = express();

// Middlewares
app.use(helmet());
app.use(cors({
  origin: true, // In production, specify exact domains
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Sessions (mainly if we want to use them, but we use JWT/Cookies mostly. Still good for basic tracking)
app.use(session({
  secret: env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: env.NODE_ENV === 'production' }
}));

// Serve static frontend files
const path = require('path');
app.use(express.static(path.join(__dirname, '../frontend')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/language', languageRoutes);

// Error Handling (Must be last middleware)
app.use(errorHandler);

module.exports = app;
