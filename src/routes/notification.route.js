const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/notification.controller');
const authMiddleware = require('../middlewares/auth.middleware');

// // Get all notifications for a user
// router.get('/', authMiddleware, notificationController.getNotifications);

// // Mark notification as read
// router.put('/:id/read', authMiddleware, notificationController.markAsRead);

// // Create a notification
// router.post('/', authMiddleware, notificationController.createNotification);

// module.exports = router;

router.use(authMiddleware)

// Get notifications
router.get('/', NotificationController.getMyNotifications)

// Create notification (Admin / System)
router.post('/', NotificationController.createNotification)

// Mark one as read
router.patch('/:id/read', NotificationController.markNotificationRead)

// Mark all as read
router.patch('/read-all', NotificationController.markAllRead)

// Delete notification
router.delete('/:id', NotificationController.deleteNotification)

module.exports = router;
