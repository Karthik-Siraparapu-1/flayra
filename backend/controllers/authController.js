const User = require('../models/User');
const OTP = require('../models/OTP');
const jwt = require('jsonwebtoken');
const EmailService = require('../services/EmailService');

// Helper to check valid domains and extract university name
const getUniversityFromEmail = (email) => {
  const domain = email.split('@')[1];
  if (!domain) return null;
  // Allow only .edu or .ac.in or specific educational domains
  if (!domain.endsWith('.edu') && !domain.endsWith('.ac.in') && !domain.endsWith('.edu.in')) {
    return null; // Invalid
  }
  // Extract name: e.g., 'marwadiuniversity.ac.in' -> 'marwadiuniversity' -> 'Marwadi University'
  const nameParts = domain.split('.')[0];
  return nameParts.charAt(0).toUpperCase() + nameParts.slice(1) + ' University';
};

// Generate 6 digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

exports.requestSignupOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const universityName = getUniversityFromEmail(email);
    if (!universityName) {
      return res.status(400).json({ error: 'Please use a valid university email (.edu, .ac.in)' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Account already exists. Please login.' });
    }

    // Generate and store OTP
    const otp = generateOTP();
    await OTP.deleteMany({ email }); // Remove old OTPs
    await OTP.create({ email, otp });

    // Send branded OTP email
    console.log(`[AUTH] OTP for ${email}: ${otp}`);
    await EmailService.sendOTPEmail(email, otp, 'signup');

    res.status(200).json({ message: 'OTP sent to email', university: universityName });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during OTP generation' });
  }
};

exports.verifyOTPAndSignup = async (req, res) => {
  try {
    const { email, otp, nickname, firstName, lastName, age, gender } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP required' });

    // Verify OTP
    const validOtp = await OTP.findOne({ email, otp });
    if (!validOtp) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    const universityName = getUniversityFromEmail(email);

    // Create user
    const newUser = await User.create({
      email,
      university: universityName,
      nickname,
      firstName,
      lastName,
      age,
      gender,
      location: { type: 'Point', coordinates: [0, 0] }
    });

    await OTP.deleteMany({ email }); // clear OTP

    // Send Welcome Email
    await EmailService.sendWelcomeEmail(email, firstName || nickname || 'Student');

    // Generate JWT
    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });
    
    res.status(201).json({ token, user: newUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during signup' });
  }
};

exports.requestLoginOTP = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: 'User not found. Please sign up.' });
    }

    const otp = generateOTP();
    await OTP.deleteMany({ email });
    await OTP.create({ email, otp });

    // Send branded Login OTP email
    await EmailService.sendOTPEmail(email, otp, 'login');

    res.status(200).json({ message: 'Login OTP sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during login request' });
  }
};

exports.verifyLoginOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP required' });

    const validOtp = await OTP.findOne({ email, otp });
    if (!validOtp) {
      return res.status(400).json({ error: 'Invalid or expired OTP' });
    }

    const user = await User.findOne({ email });
    await OTP.deleteMany({ email });

    // Send Welcome Back Email
    await EmailService.sendWelcomeBackEmail(email, user.firstName || user.nickname || 'Student');

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '30d' });

    res.status(200).json({ token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during login verification' });
  }
};
