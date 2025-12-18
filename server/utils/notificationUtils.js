// server/utils/notificationUtils.js
const Notification = require('../models/Notification');

/**
 * Create and save a notification for a user
 * @param {ObjectId} userId - User to notify
 * @param {String} type - Notification type
 * @param {String} message - Notification message
 * @param {Object} data - Extra data (optional)
 * @returns {Promise<Notification>}
 */
async function createNotification(userId, type, message, data = {}) {
  const notification = new Notification({
    user: userId,
    type,
    message,
    data,
    read: false
  });
  await notification.save();
  return notification;
}

module.exports = { createNotification };
