// const NotificationService = require('../services/notification.service');

// const getNotifications = async (req, res) => {
//   try {
//     const userId = req.user.user_id; // from auth middleware
//     const notifications = await notificationService.getNotificationsByUser(userId);
//     res.json({ success: true, data: notifications });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: 'Server Error' });
//   }
// };

// const markAsRead = async (req, res) => {
//   try {
//     const notificationId = parseInt(req.params.id);
//     const notification = await notificationService.markAsRead(notificationId);
//     res.json({ success: true, data: notification });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: 'Server Error' });
//   }
// };

// const createNotification = async (req, res) => {
//   try {
//     const data = req.body;
//     const notification = await notificationService.createNotification(data);

//     // Emit real-time event via Socket.IO
//         // Emit real-time event via Socket.IO (if configured)
//     const io = req.app.get('io');
//     if (io) {
//       io.to(`user_${notification.user_id}`).emit('new_notification', notification);
//     }
//     res.status(201).json({ success: true, data: notification });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ success: false, message: 'Server Error' });
//   }
// };

// module.exports = {
//   getNotifications,
//   markAsRead,
//   createNotification,
// };
// import * as NotificationService from '../services/notification.service.js'
const NotificationService = require('../services/notification.service')

const createNotification = async (req, res) => {
  try {
    const notification = await NotificationService.createNotification(req.body)

    if (req.io && notification?.user_id) {
      req.io
        .to(`user_${notification.user_id}`)
        .emit('notification:new', notification)
    }

    res.status(201).json({ success: true, data: notification })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

const getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.user_id

    const notifications = await NotificationService.getUserNotifications(
      userId,
      req.query
    )
console.log("notifications"+ JSON.stringify(notifications))
    res.json({ success: true, data: notifications })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

const markNotificationRead = async (req, res) => {
  try {
    const userId = req.user.user_id
    const { id } = req.params

    await NotificationService.markAsRead(Number(id), userId)

    res.json({ success: true, message: 'Notification marked as read' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

const markAllRead = async (req, res) => {
  try {
    const userId = req.user.user_id

    await NotificationService.markAllAsRead(userId)

    res.json({ success: true, message: 'All notifications marked as read' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

const deleteNotification = async (req, res) => {
  try {
    const userId = req.user.user_id
    const { id } = req.params

    await NotificationService.deleteNotification(Number(id), userId)

    res.json({ success: true, message: 'Notification deleted' })
  } catch (error) {
    res.status(500).json({ success: false, message: error.message })
  }
}

module.exports = {
  markNotificationRead,
  getMyNotifications,
  markAllRead,
  createNotification,
  deleteNotification
}
