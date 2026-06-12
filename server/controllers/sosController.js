// server/controllers/sosController.js
const SosAlert = require('../models/SosAlert');
const User = require('../models/User');
const FamilyMember = require('../models/FamilyMember');
const whatsappService = require('../services/whatsappService');

exports.sendSOS = async (req, res) => {
  try {
    const { lat, lng, address, message, type } = req.body;
    const user = await User.findById(req.user.id);
    const familyMembers = await FamilyMember.find({ user: req.user.id, isActive: true });
    const mapsLink = `https://www.google.com/maps?q=${lat},${lng}`;

    let finalMessage = message;
    let targetMembers = familyMembers;

    // Customize message based on button type
    switch (type) {
      case 'gps':
        finalMessage = `📍 *${user.name}'s Live Location*\n\n${user.name} has shared their live location with you.\n\n📍 Location: ${mapsLink}\n\n_MediGuardian App_`;
        break;

      case 'whatsapp':
        finalMessage = `🚨 *Emergency Alert!*\n\nI need immediate assistance.\nMy current location: ${mapsLink}\n\n_Sent from MediGuardian_`;
        break;

      case 'family':
        finalMessage = `🚨 *Emergency Notification*\n\nAn emergency has been triggered by *${user.name}*. Please check on them immediately.\n\n📍 Location: ${mapsLink}\n\n_MediGuardian Emergency System_`;
        targetMembers = familyMembers.filter(m => m.receiveAlerts);
        break;

      case 'society':
        finalMessage = `🏘️ *Society SOS Alert!*\n\n*${user.name}* needs immediate help from society security team!\n\n📍 Location: ${mapsLink}\n\n_MediGuardian Emergency System_`;
        targetMembers = familyMembers.filter(m => m.relation === 'society_team' || m.receiveSOS);
        break;

      default: // sos
        finalMessage = `🚨 *EMERGENCY SOS*\n\n${user.name} needs immediate help!\n\n📍 Live Location: ${mapsLink}\n\n_MediGuardian Emergency System_`;
        targetMembers = familyMembers.filter(m => m.receiveSOS);
    }

    const sosAlert = await SosAlert.create({
      user: req.user.id,
      location: { lat, lng, address, mapsLink },
      message: finalMessage,
    });

    // Send WhatsApp to all target family members
    const alertsSent = [];
    for (const member of targetMembers) {
      if (member.whatsapp) {
        const success = await whatsappService.sendCustomMessage(member.whatsapp, finalMessage);
        alertsSent.push({
          recipient: member.name,
          channel: 'whatsapp',
          sentAt: new Date(),
          success,
        });
      }
    }

    sosAlert.alertsSent = alertsSent;
    await sosAlert.save();

    const io = req.app.get('io');
    if (io) io.emit('sos-alert', { user: user.name, location: { lat, lng }, mapsLink, type });

    res.status(200).json({
      success: true,
      data: sosAlert,
      message: `Alert sent to ${alertsSent.filter(a => a.success).length} of ${alertsSent.length} contacts`,
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