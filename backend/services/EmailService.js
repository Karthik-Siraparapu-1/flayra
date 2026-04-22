const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false, 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const APP_NAME = 'Flayra';
const PRIMARY_COLOR = '#FB7185'; // Rose Flame
const SECONDARY_COLOR = '#2E1065'; // Aura Purple

/**
 * Base email wrapper for consistent branding
 */
const emailWrapper = (content) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
        .header { background: linear-gradient(135deg, ${PRIMARY_COLOR}, #991B1B); padding: 40px 20px; text-align: center; }
        .header h1 { color: #ffffff; margin: 0; font-size: 28px; letter-spacing: 2px; text-transform: uppercase; font-weight: 900; }
        .content { padding: 40px 30px; line-height: 1.6; color: ${SECONDARY_COLOR}; }
        .footer { background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
        .otp-box { background-color: #fff1f2; border: 2px dashed ${PRIMARY_COLOR}; border-radius: 12px; padding: 20px; text-align: center; margin: 30px 0; }
        .otp-code { font-size: 36px; font-weight: 800; color: ${PRIMARY_COLOR}; letter-spacing: 5px; }
        .btn { display: inline-block; padding: 14px 30px; background-color: ${PRIMARY_COLOR}; color: #ffffff !important; text-decoration: none; border-radius: 30px; font-weight: 700; margin-top: 20px; box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2); }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${APP_NAME}</h1>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            &copy; ${new Date().getFullYear()} ${APP_NAME}. Enter the Aura.<br>
            The Premium University Social Network.
        </div>
    </div>
</body>
</html>
`;

exports.sendOTPEmail = async (email, otp, type = 'signup') => {
  const subject = type === 'signup' ? `${APP_NAME} - Verify Your Account` : `${APP_NAME} - Login Access Code`;
  const title = type === 'signup' ? 'Welcome to the Campus Elite!' : 'Welcome Back!';
  const message = type === 'signup' 
    ? "We're excited to have you join our exclusive university network. Access your world with the code below."
    : "Securely access your account using the one-time password below.";

  const html = emailWrapper(`
    <h2 style="margin-top: 0;">${title}</h2>
    <p>${message}</p>
    <div class="otp-box">
        <div class="otp-code">${otp}</div>
        <p style="margin-bottom: 0; color: #991B1B; font-size: 13px; font-weight: 600;">OTP expires in 5 minutes</p>
    </div>
    <p>If you didn't request this code, you can safely ignore this email.</p>
  `);

  return transporter.sendMail({
    from: `"${APP_NAME}" <${process.env.EMAIL_USER}>`,
    to: email,
    subject,
    html,
    text: `Your ${APP_NAME} OTP is: ${otp}`, // Fallback
  });
};

exports.sendWelcomeEmail = async (email, firstName) => {
  const html = emailWrapper(`
    <h2 style="margin-top: 0;">Welcome to ${APP_NAME}, ${firstName}! 🎉</h2>
    <p>Your account is now fully verified. You're part of the most exclusive university network designed for real campus connections.</p>
    <p><strong>Next steps:</strong></p>
    <ul style="padding-left: 20px;">
        <li>Complete your profile with a high-quality photo.</li>
        <li>Check out the <strong>Campus Map</strong> to see who's nearby.</li>
        <li>Share your first <strong>Reel</strong> to introduce yourself.</li>
    </ul>
    <div style="text-align: center;">
        <a href="#" class="btn">Enter Flayra</a>
    </div>
    <p style="margin-top: 30px;">See you on the leaderboard!</p>
  `);

  return transporter.sendMail({
    from: `"${APP_NAME}" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Welcome to ${APP_NAME}! 👋`,
    html,
    text: `Welcome to ${APP_NAME}, ${firstName}! Your account is verified.`,
  });
};

exports.sendWelcomeBackEmail = async (email, firstName) => {
  const html = emailWrapper(`
    <h2 style="margin-top: 0;">Glad to see you again, ${firstName}! ✨</h2>
    <p>You've successfully logged back into your ${APP_NAME} account.</p>
    <p>Don't miss out on what's happening on your campus today:</p>
    <ul style="padding-left: 20px;">
        <li>Check out trending <strong>Reels</strong>.</li>
        <li>See who's currently on the <strong>Map</strong>.</li>
        <li>Check your latest <strong>Matches</strong> and messages.</li>
    </ul>
    <p>Connecting campus life, one student at a time.</p>
  `);

  return transporter.sendMail({
    from: `"${APP_NAME}" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: `Welcome Back to ${APP_NAME}!`,
    html,
    text: `Welcome back to ${APP_NAME}, ${firstName}!`,
  });
};
