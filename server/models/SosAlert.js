const mongoose = require('mongoose');

const SosAlertSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  location: {
    lat: { type: Number },
    lng: { type: Number },
    address: { type: String },
    mapsLink: { type: String },
  },
  message: { type: String, default: 'Emergency! I need immediate help!' },
  alertsSent: [{
    recipient: String,
    channel: String,
    sentAt: Date,
    success: Boolean,
  }],
  status: { type: String, enum: ['active', 'resolved', 'cancelled'], default: 'active' },
  resolvedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('SosAlert', SosAlertSchema);