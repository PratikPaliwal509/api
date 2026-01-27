
const { use } = require('react');
const prisma = require('../config/db');
const { sendEmail } = require('./email.service.js')
/**
 * Create notification
 */
// const createNotification = async (data) => {
//   const userId = data.user_id
//   const title = data.title
//   const message = data.message
//   const notification = await prisma.notification.create({
//     data: {
//       user_id: data.user_id,
//       notification_type: data.notification_type,
//       title: data.title,
//       message: data.message,
//       entity_type: data.entity_type || null,
//       entity_id: data.entity_id || null,
//       action_url: data.action_url || null,
//       sent_via_email: data.sent_via_email || false,
//       sent_via_push: data.sent_via_push || false
//     }
//   })
//   const sendEmailNotification = true
//   if (sendEmailNotification) {
//     const user = await prisma.user.findUnique({
//       where: { user_id: userId },
//       // select: { email: true, first_name: true },
//     })
//     if (user?.email) {
//       await sendEmail({
//         to: user.email,
//         subject: title,
//         html: `
//           <p>Hi ${user.first_name},</p>
//           <p>${message}</p>
//         `,
//       })
//     }
//   }
//   return notification
// }

const createNotification = async (data) => {

  // =========================
  // 1️⃣ MAIN USER NOTIFICATION
  // =========================
  const notification = await prisma.notification.create({
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

  // 📧 Email to main user
  if (data.sent_via_email) {
    const user = await prisma.user.findUnique({
      where: { user_id: data.user_id },
      select: { email: true, first_name: true }
    })

    if (user?.email) {
      try {
        await sendEmail({
          to: user.email,
          subject: data.title,
          html: `<p>Hi ${user.first_name},</p><p>${data.message}</p>`
        });
        console.log('Email sent to user:', user.email);
      } catch (err) {
        console.error('Failed to send email to user:', user.email, err);
      }
    }
  }

  // =========================
  // 🔔 ADMIN NOTIFICATIONS
  // =========================
  if (data.send_to_admin === true) {

    const admins = await prisma.user.findMany({
      where: {
        role: { role_name: 'Admin' }, // adjust case if needed
        is_active: true
      },
      select: {
        user_id: true,
        email: true,
        first_name: true
      }
    })

    for (const admin of admins) {

      // 📝 choose admin message
      const adminMessage = data.admin_message || data.message

      // Create admin notification
      await prisma.notification.create({
        data: {
          user_id: admin.user_id,
          notification_type: data.notification_type,
          title: data.title,
          message: adminMessage,
          entity_type: data.entity_type || null,
          entity_id: data.entity_id || null,
          action_url: data.action_url || null,
          sent_via_email: data.sent_via_email || false,
          sent_via_push: data.sent_via_push || false
        }
      })

      // 📧 Email admin (optional)
      if (data.sent_via_email && admin.email) {
        await sendEmail({
          to: admin.email,
          subject: `[Admin] ${data.title}`,
          html: `
            <p>Hi ${admin.first_name},</p>
            <p>${adminMessage}</p>
          `
        })
      }
    }
  }

  return notification
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
  // createNotification,
  createNotification
};