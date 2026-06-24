const express = require('express');
const router = express.Router();
const {
  getReminders,
  takeReminder,
  snoozeReminder,
  skipReminder,
  getMissedReminders,
} = require('../controllers/reminderController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getReminders);
router.get('/missed', getMissedReminders);
router.put('/:id/take', takeReminder);
router.put('/:id/snooze', snoozeReminder);
router.put('/:id/skip', skipReminder);

module.exports = router;