const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { limitStrict } = require('../middleware/RateLimitMiddleware');

// Signup flow
router.post('/signup', limitStrict, authController.requestSignupOTP);
router.post('/verify-otp', limitStrict, authController.verifyOTPAndSignup); // Creates user and returns JWT

// Login flow
router.post('/login', limitStrict, authController.requestLoginOTP);
router.post('/login/verify', limitStrict, authController.verifyLoginOTP); // Verifies OTP and returns JWT

module.exports = router;
