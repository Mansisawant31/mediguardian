const mongoose = require('mongoose');

const MedicineSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  type: {
    type: String,
    enum: ['tablet', 'syrup', 'injection', 'drops', 'inhaler', 'capsule', 'cream'],
    default: 'tablet',
  },
  dosage: { type: String, required: true },
  frequency: {
    type: String,
    enum: ['once_daily', 'twice_daily', 'thrice_daily', 'every_4_hours', 'every_6_hours', 'weekly', 'monthly', 'as_needed'],
    default: 'once_daily',
  },
  times: [{ type: String }],
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  refillDate: { type: Date },
  totalPills: { type: Number },
  pillsRemaining: { type: Number },
  instructions: { type: String },
  sideEffects: { type: String },
  prescribedBy: { type: String },
  color: { type: String, default: '#4CAF50' },
  image: { type: String },
  isActive: { type: Boolean, default: true },
  reminderChannels: {
    push: { type: Boolean, default: true },
    whatsapp: { type: Boolean, default: false },
    sms: { type: Boolean, default: false },
    email: { type: Boolean, default: false },
  },
}, { timestamps: true });

module.exports = mongoose.model('Medicine', MedicineSchema);