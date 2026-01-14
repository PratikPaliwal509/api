// const prisma = require('../config/db');

// const getNotificationsByUser = async (userId) => {
//   return await prisma.notification.findMany({
//     where: { user_id: userId },
//     orderBy: { created_at: 'desc' },
//   });
// };

// const markAsRead = async (notificationId) => {
//   return await prisma.notification.update({
//     where: { notification_id: notificationId },
//     data: { is_read: true, read_at: new Date() },
//   });
// };

// const createNotification = async (data) => {
//   return await prisma.notification.create({
//     data: {
//       user_id: data.user_id,
//       notification_type: data.notification_type,
//       title: data.title,
//       message: data.message,
//       entity_type: data.entity_type,
//       entity_id: data.entity_id,
//       action_url: data.action_url,
//       sent_via_email: data.sent_via_email || false,
//       sent_via_push: data.sent_via_push || false,
//     },
//   });
// };

// module.exports = {
//   getNotificationsByUser,
//   markAsRead,
//   createNotification,
// };
const prisma = require('../config/db');

/**
 * Create notification
 */
const createNotification = async (data) => {
  return prisma.notification.create({
    data: {
      user_id: data.user_id,
      notification_type: data.notification_type,
      title: data.title,
      message: data.message,
      entity_type: data.entity_type || null,
      entity_id: data.entity_id || null,
      action_url: data.action_url || null,
      sent_via_email: data.sent_via_email || false,
      sent_via_push: data.sent_via_push || false
    }
  })
}

/**
 * Get notifications for user
 */
const getUserNotifications = async (userId, options) => {
  const { page = 1, limit = 20, unreadOnly = false } = options
  const skip = (page - 1) * limit

  return prisma.notification.findMany({
    where: {
      user_id: userId,
      ...(unreadOnly && { is_read: false })
    },
    orderBy: { created_at: 'desc' },
    skip,
    take: limit
  })
}

/**
 * Mark single notification as read
 */
const markAsRead = async (notificationId, userId) => {
  return prisma.notification.updateMany({
    where: {
      notification_id: notificationId,
      user_id: userId
    },
    data: {
      is_read: true,
      read_at: new Date()
    }
  })
}

/**
 * Mark all notifications as read
 */
const markAllAsRead = async (userId) => {
  return prisma.notification.updateMany({
    where: {
      user_id: userId,
      is_read: false
    },
    data: {
      is_read: true,
      read_at: new Date()
    }
  })
}

/**
 * Delete notification (optional)
 */
const deleteNotification = async (notificationId, userId) => {
  return prisma.notification.deleteMany({
    where: {
      notification_id: notificationId,
      user_id: userId
    }
  })
}
module.exports = {
  deleteNotification,
  
  markAsRead,
  markAllAsRead,
  getUserNotifications,
  createNotification,
};