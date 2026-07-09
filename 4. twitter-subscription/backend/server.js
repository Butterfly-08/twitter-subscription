require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

// Import Routes
const authRoutes = require('./routes/auth');
const audioTweetsRoutes = require('./routes/audioTweets');

const app = express();
const PORT = process.env.PORT || 4000;

// Connect to MongoDB
connectDB();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/audio-tweets', audioTweetsRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);
    res.status(500).json({
        success: false,
        reason: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred.',
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
