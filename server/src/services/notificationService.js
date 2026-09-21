const Notification = require('../models/Notification');
const { getIO } = require('../socket');

/**
 * Dispatch notification and broadcast live via Socket.IO
 */
const sendNotification = async ({
  userId,
  type,
  title,
  message,
  data = {},
  channel = 'in_app',
}) => {
  try {
    if (!userId || !type || !title || !message) {
      return null;
    }

    const notification = await Notification.create({
      userId,
      type,
      title,
      message,
      data,
      channel,
    });

    // Broadcast live over Socket.IO
    const io = getIO();
    if (io) {
      io.to(`user:${userId.toString()}`).emit('notification:new', notification);
    }

    return notification;
  } catch (error) {
    console.error('[Notification Service Error]:', error);
    return null;
  }
};

/**
 * Mark notification as read
 */
const markAsRead = async (notificationId, userId) => {
  return await Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { readAt: new Date() },
    { new: true }
  );
};

/**
 * Mark all user notifications as read
 */
const markAllAsRead = async (userId) => {
  return await Notification.updateMany(
    { userId, readAt: null },
    { readAt: new Date() }
  );
};

/**
 * Get unread notification count
 */
const getUnreadCount = async (userId) => {
  return await Notification.countDocuments({ userId, readAt: null });
};

module.exports = {
  sendNotification,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
};
