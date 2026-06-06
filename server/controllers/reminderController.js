const Reminder = require('../models/Reminder');
const Notification = require('../models/Notification');

exports.getReminders = async (req, res) => {
  try {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(); end.setHours(23, 59, 59, 999);
    const reminders = await Reminder.find({
      user: req.user.id,
      scheduledTime: { $gte: start, $lte: end },
    }).populate('medicine', 'name type dosage color image').sort('scheduledTime');
    res.status(200).json({ success: true, data: reminders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.takeReminder = async (req, res) => {
  try {
    const reminder = await Reminder.findById(req.params.id).populate('medicine');
    if (!reminder) return res.status(404).json({ success: false, message: 'Reminder not found' });
    reminder.status = 'taken';
    reminder.takenAt = new Date();
    await reminder.save();
    await Notification.create({
      user: req.user.id,
      title: '✅ Medicine Taken',
      message: `You took ${reminder.medicine.name} (${reminder.medicine.dosage})`,
      type: 'reminder',
    });
    const io = req.app.get('io');
    if (io) io.to(req.user.id.toString()).emit('reminder-taken', reminder);
    res.status(200).json({ success: true, data: reminder });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.snoozeReminder = async (req, res) => {
  try {
    const { minutes = 15 } = req.body;
    const reminder = await Reminder.findById(req.params.id);
    if (!reminder) return res.status(404).json({ success: false, message: 'Reminder not found' });
    reminder.status = 'snoozed';
    reminder.snoozeUntil = new Date(Date.now() + minutes * 60 * 1000);
    await reminder.save();
    res.status(200).json({ success: true, data: reminder, message: `Snoozed for ${minutes} minutes` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.skipReminder = async (req, res) => {
  try {
    const reminder = await Reminder.findById(req.params.id);
    if (!reminder) return res.status(404).json({ success: false, message: 'Reminder not found' });
    reminder.status = 'skipped';
    await reminder.save();
    res.status(200).json({ success: true, data: reminder });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};