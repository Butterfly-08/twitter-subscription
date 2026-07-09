const bcrypt = require('bcryptjs');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const generateLetterPassword = require('../utils/passwordGenerator');
const { sendNewPasswordEmail } = require('../utils/sendEmail');

// @desc register new user
// @route POST /api/auth/register
const registerUser = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please fill all fields' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    if (phone) {
      const existingPhone = await User.findOne({ phone });
      if (existingPhone) {
        return res.status(400).json({ message: 'User already exists with this phone number' });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      phone: phone || undefined,
      password: hashedPassword,
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
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
      phone: user.phone,
      plan: user.plan,
      token: generateToken(user._id),
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Something went wrong while logging in' });
  }
};

// @desc reset password using registered email or phone number, limited to once per day
// @route POST /api/auth/forgot-password
// generates a brand new letters-only password, saves it, and emails it to the user
const forgotPassword = async (req, res) => {
  try {
    const { identifier } = req.body;

    if (!identifier || !identifier.trim()) {
      return res.status(400).json({ message: 'Please enter your registered email or phone number' });
    }

    const trimmedIdentifier = identifier.trim();

    // identifier could be an email or a phone number, check both fields
    const user = await User.findOne({
      $or: [{ email: trimmedIdentifier.toLowerCase() }, { phone: trimmedIdentifier }],
    });

    // don't reveal whether the account exists or not
    if (!user) {
      return res.json({
        message: 'If an account exists with that email or phone number, a new password has been sent to the registered email.',
      });
    }

    // enforce one reset request per day per user
    if (user.lastPasswordResetRequest) {
      const lastRequestTime = new Date(user.lastPasswordResetRequest).getTime();
      const hoursSinceLastRequest = (Date.now() - lastRequestTime) / (1000 * 60 * 60);

      if (hoursSinceLastRequest < 24) {
        return res.status(429).json({ message: 'You can use this option only one time per day.' });
      }
    }

    // letters only, no numbers or special characters, keeps it simple to read and type
    const newPassword = generateLetterPassword(10);

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.lastPasswordResetRequest = new Date();
    await user.save();

    try {
      await sendNewPasswordEmail({
        toEmail: user.email,
        userName: user.name,
        newPassword,
      });
    } catch (emailErr) {
      console.log('New password email failed to send:', emailErr.message);
      return res.status(500).json({ message: 'Could not send the new password by email, please try again later' });
    }

    res.json({
      message: 'A new password has been generated and sent to your registered email.',
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Something went wrong while processing your request' });
  }
};

module.exports = { registerUser, loginUser, forgotPassword };
