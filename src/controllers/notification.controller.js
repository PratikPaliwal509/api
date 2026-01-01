const notificationService = require('../services/notification.service');

const getNotifications = async (req, res) => {
  try {
    const userId = req.user.user_id; // from auth middleware
    const notifications = await notificationService.getNotificationsByUser(userId);
    res.json({ success: true, data: notifications });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const markAsRead = async (req, res) => {
  try {
    const notificationId = parseInt(req.params.id);
    const notification = await notificationService.markAsRead(notificationId);
    res.json({ success: true, data: notification });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const createNotification = async (req, res) => {
  try {
    const data = req.body;
    const notification = await notificationService.createNotification(data);

    // Emit real-time event via Socket.IO
        // Emit real-time event via Socket.IO (if configured)
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${notification.user_id}`).emit('new_notification', notification);
    }
    res.status(201).json({ success: true, data: notification });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  createNotification,
};
