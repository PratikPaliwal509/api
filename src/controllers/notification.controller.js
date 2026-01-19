
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
