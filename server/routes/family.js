const express = require('express');
const router = express.Router();
const { getFamilyMembers, addFamilyMember, updateFamilyMember, deleteFamilyMember } = require('../controllers/familyController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.route('/').get(getFamilyMembers).post(addFamilyMember);
router.route('/:id').put(updateFamilyMember).delete(deleteFamilyMember);

module.exports = router;