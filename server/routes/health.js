const express = require('express');
const router = express.Router();
const { getHealthMetrics, addHealthMetric, getHealthSummary } = require('../controllers/healthController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/summary', getHealthSummary);
router.route('/').get(getHealthMetrics).post(addHealthMetric);

module.exports = router;