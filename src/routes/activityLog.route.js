const express = require('express');
const router = express.Router();
const activityLogController = require('../controllers/activityLog.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Get all activity logs (optionally filter by user or entity)
router.get('/', authMiddleware, activityLogController.getActivityLogs);

// Get single activity log by ID
router.get('/:id', authMiddleware, activityLogController.getActivityLogById);

module.exports = router;
