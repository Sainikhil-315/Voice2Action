// server/utils/notificationUtils.js
const Notification = require('../models/Notification');

/**
 * Create and save a notification for a user
 * @param {ObjectId} userId - User to notify
 * @param {String} type - Notification type
 * @param {String} message - Notification message
 * @param {Object} data - Extra data (optional)
 * @param {Object} io - Socket.IO instance (optional, for real-time emit)
 * @returns {Promise<Notification>}
 */
async function createNotification(userId, type, message, data = {}, io = null) {
  try {
    console.log(`📝 Creating notification for user ${userId}:`, { type, message });
    
    const notification = new Notification({
      user: userId,
      type,
      message,
      data,
      read: false,
      createdAt: new Date()
    });
    
    await notification.save();
    console.log('✅ Notification saved to DB:', notification._id);
    
    // If Socket.IO instance is provided, emit the notification in real-time
    if (io) {
      const notificationObj = notification.toObject();
      console.log(`📡 Emitting notification to user_${userId}`);
      io.to(`user_${userId}`).emit('notification', notificationObj);
      console.log('✅ Real-time notification emitted');
    } else {
      console.log('⚠️ No Socket.IO instance provided, skipping real-time emit');
    }
    
    return notification;
  } catch (error) {
    console.error('❌ Error creating notification:', error);
    throw error;
  }
}

/**
 * Create notifications for multiple users
 * @param {Array<ObjectId>} userIds - Array of user IDs
 * @param {String} type - Notification type
 * @param {String} message - Notification message
 * @param {Object} data - Extra data (optional)
 * @param {Object} io - Socket.IO instance (optional)
 * @returns {Promise<Array<Notification>>}
 */
async function createBulkNotifications(userIds, type, message, data = {}, io = null) {
  try {
    console.log(`📝 Creating bulk notifications for ${userIds.length} users`);
    
    const notifications = await Promise.all(
      userIds.map(userId => createNotification(userId, type, message, data, io))
    );
    
    console.log(`✅ ${notifications.length} notifications created`);
    return notifications;
  } catch (error) {
    console.error('❌ Error creating bulk notifications:', error);
    throw error;
  }
}

module.exports = { 
  createNotification,
  createBulkNotifications
};