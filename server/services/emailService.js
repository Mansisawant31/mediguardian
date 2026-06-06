const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendMissedDoseEmail = async (toEmail, userName, medicineName, scheduledTime) => {
  try {
    await transporter.sendMail({
      from: `"MediGuardian 🏥" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: `⚠️ ${userName} missed medicine - MediGuardian Alert`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px;background:#f5f5f5;">
          <div style="background:#ef4444;color:white;padding:20px;border-radius:10px 10px 0 0;text-align:center;">
            <h1>⚠️ Missed Dose Alert</h1>
          </div>
          <div style="background:white;padding:30px;border-radius:0 0 10px 10px;">
            <p><strong>${userName}</strong> missed their medicine at <strong>${scheduledTime}</strong>.</p>
            <div style="background:#fef2f2;border:1px solid #ef4444;border-radius:8px;padding:15px;margin:20px 0;">
              <p><strong>💊 Medicine:</strong> ${medicineName}</p>
              <p><strong>⏰ Scheduled:</strong> ${scheduledTime}</p>
              <p><strong>📊 Status:</strong> MISSED</p>
            </div>
            <p>Please check on ${userName} immediately.</p>
          </div>
        </div>`,
    });
    return true;
  } catch (err) {
    console.error('Email Error:', err.message);
    return false;
  }
};

exports.sendWelcomeEmail = async (toEmail, userName) => {
  try {
    await transporter.sendMail({
      from: `"MediGuardian 🏥" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: '🏥 Welcome to MediGuardian!',
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px;">
          <div style="background:linear-gradient(135deg,#10b981,#059669);color:white;padding:40px;border-radius:10px;text-align:center;">
            <h1>🏥 Welcome to MediGuardian!</h1>
            <p>Hello ${userName}, your account is ready.</p>
          </div>
          <div style="padding:30px;">
            <p>Start adding your medicines and never miss a dose again!</p>
          </div>
        </div>`,
    });
    return true;
  } catch (err) {
    console.error('Welcome email error:', err.message);
    return false;
  }
};