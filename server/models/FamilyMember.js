const mongoose = require('mongoose');

const FamilyMemberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  whatsapp: { type: String },
  email: { type: String },
  relation: {
    type: String,
    enum: ['spouse', 'parent', 'child', 'sibling', 'caregiver', 'friend', 'doctor', 'other'],
    default: 'other',
  },
  isPrimary: { type: Boolean, default: false },
  canViewMedicines: { type: Boolean, default: true },
  receiveAlerts: { type: Boolean, default: true },
  receiveSOS: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('FamilyMember', FamilyMemberSchema);