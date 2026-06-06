const cron = require('node-cron');
const Reminder = require('../models/Reminder');
const Medicine = require('../models/Medicine');
const User = require('../models/User');
const FamilyMember = require('../models/FamilyMember');
const Notification = require('../models/Notification');
const whatsappSvc = require('./whatsappService');

// Every 5 min — check missed doses
cron.schedule('*/5 * * * *', async () => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const missedReminders = await Reminder.find({
      status: 'pending',
      scheduledTime: { $gte: thirtyMinutesAgo, $lte: fiveMinutesAgo },
    }).populate('medicine user');

    for (const reminder of missedReminders) {
      reminder.status = 'missed';
      await reminder.save();

      await Notification.create({
        user: reminder.user._id,
        title: '⚠️ Missed Dose',
        message: `You missed ${reminder.medicine.name} scheduled at ${new Date(reminder.scheduledTime).toLocaleTimeString()}`,
        type: 'missed_dose',
      });

      if (!reminder.familyAlerted) {
        const familyMembers = await FamilyMember.find({
          user: reminder.user._id,
          receiveAlerts: true,
          isActive: true,
        });

        const scheduledTimeStr = new Date(reminder.scheduledTime).toLocaleTimeString('en-IN', {
          hour: '2-digit', minute: '2-digit',
        });

        for (const member of familyMembers) {
          if (member.whatsapp) {
            await whatsappSvc.sendMissedDoseAlert(
              member.whatsapp,
              reminder.user.name,
              reminder.medicine.name,
              scheduledTimeStr
            );
          }
        }

        reminder.familyAlerted = true;
        await reminder.save();
      }
    }
  } catch (err) {
    console.error('Cron Error (missed doses):', err.message);
  }
});

// Midnight — create tomorrow's reminders
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
    console.error('Cron Error (create reminders):', err.message);
  }
});

// 9 AM — refill alerts
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
        message: `${med.name} has only ${med.pillsRemaining} pills left. Time to refill!`,
        type: 'refill',
      });
    }
  } catch (err) {
    console.error('Cron Error (refill):', err.message);
  }
});

console.log('⏰ Cron jobs initialized');