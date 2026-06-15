// server/controllers/sosController.js
const SosAlert = require('../models/SosAlert');
const User = require('../models/User');
const FamilyMember = require('../models/FamilyMember');
const whatsappService = require('../services/whatsappService');

exports.sendSOS = async (req, res) => {
  try {
    const { lat, lng, address, type } = req.body;
    const user = await User.findById(req.user.id);
    const familyMembers = await FamilyMember.find({ user: req.user.id, isActive: true });

    const mapsLink = `https://www.google.com/maps?q=${lat},${lng}`;
    const hospitalsLink = `https://www.google.com/maps/search/hospitals/@${lat},${lng},14z`;

    let finalMessage = '';
    let targetMembers = familyMembers;

    switch (type) {
      case 'gps':
        finalMessage = `📍 *${user.name}'s Live Location*\n\n${user.name} has shared their live location with you.\n\n📍 Location: ${mapsLink}\n\n🏥 Nearby Hospitals: ${hospitalsLink}\n\n_MediGuardian App_`;
        targetMembers = familyMembers;
        break;

      case 'whatsapp':
        finalMessage = `🚨 *Emergency Alert!*\n\n${user.name} needs immediate assistance.\n\n📍 Current location: ${mapsLink}\n\n_Sent from MediGuardian_`;
        targetMembers = familyMembers;
        break;

      case 'family':
        finalMessage = `🚨 *Emergency Notification*\n\nAn emergency has been triggered by *${user.name}*. Please check on them immediately.\n\n📍 Location: ${mapsLink}\n\n_MediGuardian Emergency System_`;
        targetMembers = familyMembers.filter(m => m.receiveAlerts !== false);
        break;

      case 'society':
        finalMessage = `🏘️ *Society SOS Alert!*\n\n*${user.name}* needs immediate help from society security team!\n\n📍 Location: ${mapsLink}\n\n_MediGuardian Emergency System_`;
        targetMembers = familyMembers.filter(
          m => m.relation === 'society_team' || m.receiveSOS !== false
        );
        break;

      default: // 'sos'
        finalMessage = `🚨 *EMERGENCY SOS*\n\n${user.name} needs immediate help!\n\n📍 Live Location: ${mapsLink}\n\n🏥 Nearby Hospitals: ${hospitalsLink}\n\n_MediGuardian Emergency System_`;
        targetMembers = familyMembers.filter(m => m.receiveSOS !== false);
    }

    const sosAlert = await SosAlert.create({
      user: req.user.id,
      location: { lat, lng, address, mapsLink },
      message: finalMessage,
    });

    const alertsSent = [];

    if (targetMembers.length === 0) {
      return res.status(200).json({
        success: true,
        data: sosAlert,
        message: 'No family members added yet. Please add family members with WhatsApp numbers.',
        alertsSent: [],
      });
    }

    for (const member of targetMembers) {
      if (member.whatsapp) {
        const success = await whatsappService.sendCustomMessage(member.whatsapp, finalMessage);
        alertsSent.push({
          recipient: member.name,
          channel: 'whatsapp',
          sentAt: new Date(),
          success,
        });
      } else {
        alertsSent.push({
          recipient: member.name,
          channel: 'whatsapp',
          sentAt: new Date(),
          success: false,
          reason: 'No WhatsApp number added',
        });
      }
    }

    sosAlert.alertsSent = alertsSent;
    await sosAlert.save();

    const io = req.app.get('io');
    if (io) io.emit('sos-alert', { user: user.name, location: { lat, lng }, mapsLink, type });

    const successCount = alertsSent.filter(a => a.success).length;

    res.status(200).json({
      success: true,
      data: sosAlert,
      message: successCount > 0
        ? `Alert sent to ${successCount} of ${alertsSent.length} contacts`
        : `Failed to send to all ${alertsSent.length} contacts. Check Twilio setup or family WhatsApp numbers.`,
      alertsSent,
    });
  } catch (err) {
    console.error('SOS Error:', err);
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