const mongoose = require('mongoose');

const ReminderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  medicine: { type: mongoose.Schema.Types.ObjectId, ref: 'Medicine', required: true },
  scheduledTime: { type: Date, required: true },
  status: {
    type: String,
    enum: ['pending', 'taken', 'missed', 'skipped', 'snoozed'],
    default: 'pending',
  },
  takenAt: { type: Date },
  snoozeUntil: { type: Date },
  notificationsSent: [{
    channel: String,
    sentAt: Date,
    success: Boolean,
  }],
  familyAlerted: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Reminder', ReminderSchema);