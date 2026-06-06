const FamilyMember = require('../models/FamilyMember');

exports.getFamilyMembers = async (req, res) => {
  try {
    const members = await FamilyMember.find({ user: req.user.id, isActive: true });
    res.status(200).json({ success: true, data: members });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.addFamilyMember = async (req, res) => {
  try {
    req.body.user = req.user.id;
    const member = await FamilyMember.create(req.body);
    res.status(201).json({ success: true, data: member });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateFamilyMember = async (req, res) => {
  try {
    const member = await FamilyMember.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, data: member });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteFamilyMember = async (req, res) => {
  try {
    await FamilyMember.findByIdAndUpdate(req.params.id, { isActive: false });
    res.status(200).json({ success: true, message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};