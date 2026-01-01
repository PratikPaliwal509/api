const prisma = require('../config/db');

const getNotificationsByUser = async (userId) => {
  return await prisma.notification.findMany({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' },
  });
};

const markAsRead = async (notificationId) => {
  return await prisma.notification.update({
    where: { notification_id: notificationId },
    data: { is_read: true, read_at: new Date() },
  });
};

const createNotification = async (data) => {
  return await prisma.notification.create({
    data: {
      user_id: data.user_id,
      notification_type: data.notification_type,
      title: data.title,
      message: data.message,
      entity_type: data.entity_type,
      entity_id: data.entity_id,
      action_url: data.action_url,
      sent_via_email: data.sent_via_email || false,
      sent_via_push: data.sent_via_push || false,
    },
  });
};

module.exports = {
  getNotificationsByUser,
  markAsRead,
  createNotification,
};
