// server/services/whatsappService.js
require('dotenv').config();

let client = null;

const getClient = () => {
  if (!client) {
    const twilio = require('twilio');
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;

    if (!sid || !token || sid === 'your_twilio_sid') {
      return null; // Twilio not configured yet — skip silently
    }

    try {
      client = twilio(sid, token);
    } catch (e) {
      console.warn('⚠️  Twilio not configured:', e.message);
      return null;
    }
  }
  return client;
};

const FROM = () => process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

const formatNumber = (num) => {
  const clean = num.replace(/\D/g, '');
  return `whatsapp:+${clean.startsWith('91') ? clean : '91' + clean}`;
};

exports.sendMissedDoseAlert = async (toPhone, userName, medicineName, scheduledTime) => {
  const c = getClient();
  if (!c) { console.log('⚠️  WhatsApp skipped (Twilio not configured)'); return false; }
  try {
    const msg = `⚠️ *MediGuardian Alert*\n\n${userName} missed their medicine at ${scheduledTime}.\n\n💊 *Medicine:* ${medicineName}\n\nPlease check on them immediately.\n\n_Sent by MediGuardian App_`;
    await c.messages.create({ body: msg, from: FROM(), to: formatNumber(toPhone) });
    console.log(`✅ WhatsApp sent to ${toPhone}`);
    return true;
  } catch (err) {
    console.error('WhatsApp Error:', err.message);
    return false;
  }
};

exports.sendSOS = async (toPhone, userName, mapsLink) => {
  const c = getClient();
  if (!c) { console.log('⚠️  WhatsApp SOS skipped (Twilio not configured)'); return false; }
  try {
    const msg = `🚨 *EMERGENCY ALERT*\n\n${userName} needs immediate help!\n\n📍 *Live Location:*\n${mapsLink}\n\nPlease respond immediately!\n\n_MediGuardian Emergency System_`;
    await c.messages.create({ body: msg, from: FROM(), to: formatNumber(toPhone) });
    return true;
  } catch (err) {
    console.error('WhatsApp SOS Error:', err.message);
    return false;
  }
};

exports.sendRefillAlert = async (toPhone, medicineName, pillsRemaining) => {
  const c = getClient();
  if (!c) { console.log('⚠️  WhatsApp refill skipped (Twilio not configured)'); return false; }
  try {
    const msg = `💊 *Refill Reminder*\n\nYour medicine *${medicineName}* is running low.\nOnly *${pillsRemaining} pills* remaining.\n\nPlease refill soon!\n\n_MediGuardian_`;
    await c.messages.create({ body: msg, from: FROM(), to: formatNumber(toPhone) });
    return true;
  } catch (err) {
    console.error('WhatsApp Error:', err.message);
    return false;
  }
};