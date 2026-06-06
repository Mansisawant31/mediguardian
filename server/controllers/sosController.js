const SosAlert = require('../models/SosAlert');
const User = require('../models/User');
const FamilyMember = require('../models/FamilyMember');
const whatsappService = require('../services/whatsappService');

exports.sendSOS = async (req, res) => {
  try {
    const { lat, lng, address, message } = req.body;
    const user = await User.findById(req.user.id);
    const familyMembers = await FamilyMember.find({ user: req.user.id, receiveSOS: true, isActive: true });
    const mapsLink = `https://www.google.com/maps?q=${lat},${lng}`;

    const sosAlert = await SosAlert.create({
      user: req.user.id,
      location: { lat, lng, address, mapsLink },
      message: message || `🚨 Emergency! ${user.name} needs immediate help!`,
    });

    const alertsSent = [];
    for (const member of familyMembers) {
      if (member.whatsapp) {
        try {
          await whatsappService.sendSOS(member.whatsapp, user.name, mapsLink);
          alertsSent.push({ recipient: member.name, channel: 'whatsapp', sentAt: new Date(), success: true });
        } catch (e) {
          alertsSent.push({ recipient: member.name, channel: 'whatsapp', sentAt: new Date(), success: false });
        }
      }
    }

    sosAlert.alertsSent = alertsSent;
    await sosAlert.save();

    const io = req.app.get('io');
    if (io) io.emit('sos-alert', { user: user.name, location: { lat, lng }, mapsLink });

    res.status(200).json({
      success: true,
      data: sosAlert,
      message: `SOS sent to ${alertsSent.length} contacts`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getSosHistory = async (req, res) => {
  try {
    const alerts = await SosAlert.find({ user: req.user.id }).sort('-createdAt').limit(10);
    res.status(200).json({ success: true, data: alerts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};