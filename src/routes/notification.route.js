const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// Get all notifications for a user
router.get('/', authMiddleware, notificationController.getNotifications);

// Mark notification as read
router.put('/:id/read', authMiddleware, notificationController.markAsRead);

// Create a notification
router.post('/', authMiddleware, notificationController.createNotification);

module.exports = router;