const mongoose = require('mongoose');

const HealthMetricSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['blood_pressure', 'blood_sugar', 'weight', 'heart_rate', 'oxygen', 'temperature', 'cholesterol'],
    required: true,
  },
  value: { type: Number, required: true },
  value2: { type: Number },
  unit: { type: String },
  notes: { type: String },
  recordedAt: { type: Date, default: Date.now },
  isNormal: { type: Boolean },
}, { timestamps: true });

module.exports = mongoose.model('HealthMetric', HealthMetricSchema);