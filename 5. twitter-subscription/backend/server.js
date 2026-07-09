require('dotenv').config({ path: '../.env', override: true }); // Load from parent directory
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const userRoutes = require('./routes/users');
const tweetRoutes = require('./routes/tweets');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
connectDB();

// Routes
app.use('/api/users', userRoutes);
app.use('/api/tweets', tweetRoutes);

// Add a fallback route for unmatched paths (for development convenience)
app.use((req, res) => {
    res.status(404).json({ success: false, reason: 'NOT_FOUND', message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
