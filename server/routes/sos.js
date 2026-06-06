const express = require('express');
const router = express.Router();
const { sendSOS, getSosHistory } = require('../controllers/sosController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.post('/', sendSOS);
router.get('/history', getSosHistory);

module.exports = router;