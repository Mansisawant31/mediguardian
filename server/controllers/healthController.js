const HealthMetric = require('../models/HealthMetric');

exports.getHealthMetrics = async (req, res) => {
  try {
    const { type, days = 30 } = req.query;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const filter = { user: req.user.id, recordedAt: { $gte: since } };
    if (type) filter.type = type;
    const metrics = await HealthMetric.find(filter).sort('-recordedAt');
    res.status(200).json({ success: true, data: metrics });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.addHealthMetric = async (req, res) => {
  try {
    req.body.user = req.user.id;
    const metric = await HealthMetric.create(req.body);
    res.status(201).json({ success: true, data: metric });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getHealthSummary = async (req, res) => {
  try {
    const types = ['blood_pressure', 'blood_sugar', 'weight', 'heart_rate', 'oxygen'];
    const summary = {};
    for (const type of types) {
      const latest = await HealthMetric.findOne({ user: req.user.id, type }).sort('-recordedAt');
      summary[type] = latest;
    }
    res.status(200).json({ success: true, data: summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};