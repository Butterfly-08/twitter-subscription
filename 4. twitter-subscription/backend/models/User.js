const mongoose = require('mongoose');

// Minimal User Schema for checking if email exists.
// In a real app, this would be your main User schema.
const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
    }
});

module.exports = mongoose.model('User', userSchema);
