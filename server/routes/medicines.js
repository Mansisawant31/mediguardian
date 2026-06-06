const express = require('express');
const router = express.Router();
const { getMedicines, addMedicine, updateMedicine, deleteMedicine, getMedicineHistory } = require('../controllers/medicineController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.route('/').get(getMedicines).post(addMedicine);
router.route('/:id').put(updateMedicine).delete(deleteMedicine);
router.get('/:id/history', getMedicineHistory);

module.exports = router;