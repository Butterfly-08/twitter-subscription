const bcrypt = require('bcryptjs');
const User = require('../models/User');
const LoginHistory = require('../models/LoginHistory');
const generateToken = require('../utils/generateToken');
const generateLetterPassword = require('../utils/passwordGenerator');
const { sendNewPasswordEmail, sendLoginOtpEmail } = require('../utils/sendEmail');
const { getDeviceInfo } = require('../utils/deviceDetect');
const { checkMobileLoginWindow } = require('../utils/mobileLoginWindow');

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

// @desc login user - checks device/browser rules, logs login history,
//       either logs the user straight in or requires an OTP step depending on browser
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

    const { browserName, osName, deviceType, ipAddress } = getDeviceInfo(req);

    // mobile devices are only allowed to log in within a fixed time window
    const mobileWindowError = checkMobileLoginWindow(deviceType);
    if (mobileWindowError) {
      return res.status(403).json({ message: mobileWindowError });
    }

    // chrome users need an OTP step, edge/IE (microsoft browsers) skip it entirely,
    // anything else falls through to the normal no-OTP flow too
    const isChrome = browserName.toLowerCase().includes('chrome') && !browserName.toLowerCase().includes('edge');

    if (isChrome) {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      user.loginOtp = otp;
      user.loginOtpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
      await user.save();

      try {
        await sendLoginOtpEmail({ toEmail: user.email, userName: user.name, otp });
      } catch (emailErr) {
        console.log('Login OTP email failed to send:', emailErr.message);
        return res.status(500).json({ message: 'Could not send the verification code, please try again' });
      }

      // log this attempt now too, marked as otpRequired, so it shows in history
      // even if the user never completes the OTP step
      await LoginHistory.create({
        user: user._id,
        browser: browserName,
        os: osName,
        deviceType,
        ipAddress,
        otpRequired: true,
      });

      return res.json({
        otpRequired: true,
        userId: user._id,
        message: 'A verification code has been sent to your registered email.',
      });
    }

    // non-chrome browsers (edge, firefox, safari, etc) log straight in
    await LoginHistory.create({
      user: user._id,
      browser: browserName,
      os: osName,
      deviceType,
      ipAddress,
      otpRequired: false,
    });

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

// @desc verify the OTP sent during a chrome login attempt and complete login
// @route POST /api/auth/verify-login-otp
const verifyLoginOtp = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({ message: 'Missing verification details' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.loginOtp || !user.loginOtpExpire || user.loginOtpExpire < Date.now()) {
      return res.status(400).json({ message: 'Verification code has expired, please login again' });
    }

    if (user.loginOtp !== otp) {
      return res.status(400).json({ message: 'Incorrect verification code' });
    }

    user.loginOtp = null;
    user.loginOtpExpire = null;
    await user.save();

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
    res.status(500).json({ message: 'Something went wrong while verifying the code' });
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

    const user = await User.findOne({
      $or: [{ email: trimmedIdentifier.toLowerCase() }, { phone: trimmedIdentifier }],
    });

    if (!user) {
      return res.json({
        message: 'If an account exists with that email or phone number, a new password has been sent to the registered email.',
      });
    }

    if (user.lastPasswordResetRequest) {
      const lastRequestTime = new Date(user.lastPasswordResetRequest).getTime();
      const hoursSinceLastRequest = (Date.now() - lastRequestTime) / (1000 * 60 * 60);

      if (hoursSinceLastRequest < 24) {
        return res.status(429).json({ message: 'You can use this option only one time per day.' });
      }
    }

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

// @desc get the logged in user's login history (most recent first)
// @route GET /api/auth/login-history
const getLoginHistory = async (req, res) => {
  try {
    const history = await LoginHistory.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
    res.json(history);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: 'Something went wrong while fetching login history' });
  }
};

module.exports = { registerUser, loginUser, verifyLoginOtp, forgotPassword, getLoginHistory };
