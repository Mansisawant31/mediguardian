const cron = require('node-cron');
const Reminder = require('../models/Reminder');
const Medicine = require('../models/Medicine');
const User = require('../models/User');
const FamilyMember = require('../models/FamilyMember');
const Notification = require('../models/Notification');
const whatsappSvc = require('./whatsappService');
const fcmService = require('./fcmService');

// Every minute — check missed doses and send push notifications
cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();
    const fiveMinutesAgo = new Date(now - 5 * 60 * 1000);
    const twoHoursAgo = new Date(now - 120 * 60 * 1000);

    // Find reminders that are 5-120 minutes overdue and still pending
    const overdueReminders = await Reminder.find({
      status: 'pending',
      scheduledTime: {
        $gte: twoHoursAgo,
        $lte: fiveMinutesAgo,
      },
    }).populate('medicine user');

    for (const reminder of overdueReminders) {
      if (!reminder.user || !reminder.medicine) continue;

      const diffMinutes = Math.floor((now - reminder.scheduledTime) / (1000 * 60));
      const timeStr = new Date(reminder.scheduledTime).toLocaleTimeString('en-IN', {
        hour: '2-digit', minute: '2-digit',
      });

      // Send FCM push notification to user's device
      if (reminder.user.fcmToken) {
        await fcmService.sendPushNotification(reminder.user.fcmToken, {
          title: '⚠️ Medicine Reminder!',
          body: `Take ${reminder.medicine.name} now! ${diffMinutes} min overdue (scheduled ${timeStr})`,
          reminderId: reminder._id.toString(),
          medicineName: reminder.medicine.name,
          type: 'missed_dose',
        });
      }

      // Mark as missed after 30 minutes
      if (diffMinutes >= 30 && !reminder.familyAlerted) {
        reminder.status = 'missed';
        await reminder.save();

        // Create notification
        await Notification.create({
          user: reminder.user._id,
          title: '⚠️ Missed Dose',
          message: `You missed ${reminder.medicine.name} at ${timeStr}`,
          type: 'missed_dose',
        });

        // Alert family via WhatsApp
        const familyMembers = await FamilyMember.find({
          user: reminder.user._id,
          receiveAlerts: true,
          isActive: true,
        });

        for (const member of familyMembers) {
          if (member.whatsapp) {
            await whatsappSvc.sendMissedDoseAlert(
              member.whatsapp,
              reminder.user.name,
              reminder.medicine.name,
              timeStr
            );
          }
        }

        reminder.familyAlerted = true;
        await reminder.save();
      }
    }

  } catch (err) {
    console.error('Cron Error:', err.message);
  }
});

// Daily midnight — create tomorrow's reminders
cron.schedule('0 0 * * *', async () => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const activeMedicines = await Medicine.find({ isActive: true });
    let created = 0;

    for (const medicine of activeMedicines) {
      for (const timeStr of medicine.times) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const scheduledTime = new Date(tomorrow);
        scheduledTime.setHours(hours, minutes, 0, 0);
        const exists = await Reminder.findOne({ medicine: medicine._id, scheduledTime });
        if (!exists) {
          await Reminder.create({ user: medicine.user, medicine: medicine._id, scheduledTime });
          created++;
        }
      }
    }
    console.log(`⏰ Created ${created} reminders for tomorrow`);
  } catch (err) {
    console.error('Cron Error:', err.message);
  }
});

// Daily 9 AM — refill alerts with push notification
cron.schedule('0 9 * * *', async () => {
  try {
    const lowMedicines = await Medicine.find({
      isActive: true,
      pillsRemaining: { $lte: 7, $gt: 0 },
    }).populate('user');

    for (const med of lowMedicines) {
      await Notification.create({
        user: med.user._id,
        title: '💊 Refill Reminder',
        message: `${med.name} has only ${med.pillsRemaining} pills left!`,
        type: 'refill',
      });

      // Send push notification for refill
      if (med.user.fcmToken) {
        await fcmService.sendPushNotification(med.user.fcmToken, {
          title: '💊 Refill Reminder',
          body: `${med.name} has only ${med.pillsRemaining} pills remaining. Refill soon!`,
          type: 'refill',
        });
      }
    }
  } catch (err) {
    console.error('Cron Error:', err.message);
  }
});

console.log('⏰ Cron jobs initialized');