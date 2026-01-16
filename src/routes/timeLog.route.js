const express = require('express');
const router = express.Router();

const authMiddleware = require('../middlewares/auth.middleware');
const timeLogController = require('../controllers/timeLog.controller');

// router.use(authMiddleware);

router.get(
  "/active/:taskId",
  authMiddleware,
  timeLogController.getActiveTimer
)

router.post(
  "/start",
  authMiddleware,
  timeLogController.startTimer
)

router.post(
  "/stop",
  authMiddleware,
  timeLogController.stopTimer
)

// Task → Time Logs
router.post('/:taskId/time-logs', timeLogController.createTimeLog);
router.get('/:taskId/time-logs', timeLogController.getTaskTimeLogs);
router.post(
  '/:taskId/timelogs',
  authMiddleware,
  timeLogController.createOrUpdateTimeLog
)
// Time Log actions
router.put('/time-logs/:id', timeLogController.updateTimeLog);
router.delete('/time-logs/:id', timeLogController.deleteTimeLog);
router.patch('/time-logs/:id/approve', timeLogController.approveTimeLog);

module.exports = router;
