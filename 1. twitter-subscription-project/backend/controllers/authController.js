const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { sendResetPasswordEmail } = require('../utils/sendEmail');

// @desc register new user
// @route POST /api/auth/register
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please fill all fields' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      plan: user.plan,
      token: generateToken(user._id),
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Something went wrong while registering' });
  }
};

// @desc login user
// @route POST /api/auth/login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      plan: user.plan,
      token: generateToken(user._id),
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Something went wrong while logging in' });
  }
};

// @desc send a password reset link to the user's email
// @route POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Please provide your email' });
    }

    const user = await User.findOne({ email });

    // don't reveal whether the email exists or not, just respond the same way either time
    if (!user) {
      return res.json({ message: 'If an account exists with that email, a reset link has been sent.' });
    }

    // raw token goes in the email link, hashed version is what we store in db
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 minutes
    await user.save();

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password/${rawToken}`;

    try {
      await sendResetPasswordEmail({
        toEmail: user.email,
        userName: user.name,
        resetUrl,
      });
    } catch (emailErr) {
      console.log('Reset email failed to send:', emailErr.message);
      user.resetPasswordToken = null;
      user.resetPasswordExpire = null;
      await user.save();
      return res.status(500).json({ message: 'Could not send reset email, please try again later' });
    }

    res.json({ message: 'If an account exists with that email, a reset link has been sent.' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Something went wrong while processing your request' });
  }
};

// @desc set a new password using the token from the reset email
// @route POST /api/auth/reset-password/:token
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Reset link is invalid or has expired' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;
    await user.save();

    res.json({ message: 'Password has been reset successfully, you can now login' });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Something went wrong while resetting your password' });
  }
};

module.exports = { registerUser, loginUser, forgotPassword, resetPassword };
