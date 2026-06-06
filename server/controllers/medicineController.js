const Medicine = require('../models/Medicine');
const Reminder = require('../models/Reminder');

exports.getMedicines = async (req, res) => {
  try {
    const medicines = await Medicine.find({ user: req.user.id, isActive: true }).sort('-createdAt');
    res.status(200).json({ success: true, count: medicines.length, data: medicines });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.addMedicine = async (req, res) => {
  try {
    req.body.user = req.user.id;
    if (req.body.totalPills) req.body.pillsRemaining = req.body.totalPills;
    const medicine = await Medicine.create(req.body);
    await createRemindersForMedicine(medicine);
    res.status(201).json({ success: true, data: medicine });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateMedicine = async (req, res) => {
  try {
    let medicine = await Medicine.findById(req.params.id);
    if (!medicine) return res.status(404).json({ success: false, message: 'Medicine not found' });
    if (medicine.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    medicine = await Medicine.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.status(200).json({ success: true, data: medicine });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteMedicine = async (req, res) => {
  try {
    const medicine = await Medicine.findById(req.params.id);
    if (!medicine) return res.status(404).json({ success: false, message: 'Medicine not found' });
    if (medicine.user.toString() !== req.user.id) {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    medicine.isActive = false;
    await medicine.save();
    res.status(200).json({ success: true, message: 'Medicine removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getMedicineHistory = async (req, res) => {
  try {
    const reminders = await Reminder.find({
      medicine: req.params.id,
      user: req.user.id,
    }).sort('-scheduledTime').limit(30);
    res.status(200).json({ success: true, data: reminders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

async function createRemindersForMedicine(medicine) {
  const today = new Date();
  const remindersToCreate = [];
  for (const timeStr of medicine.times) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const scheduledTime = new Date(today);
    scheduledTime.setHours(hours, minutes, 0, 0);
    if (scheduledTime > today) {
      remindersToCreate.push({
        user: medicine.user,
        medicine: medicine._id,
        scheduledTime,
      });
    }
  }
  if (remindersToCreate.length > 0) {
    await Reminder.insertMany(remindersToCreate);
  }
}