// Add this to your server/routes/notifications.js file
// This is a temporary debugging endpoint - remove in production

const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect } = require('../middleware/auth');
const { createNotification } = require('../utils/notificationUtils');

// Get all notifications for the logged-in user
router.get('/', protect, async (req, res) => {
  try {
    console.log('📥 Fetching notifications for user:', req.user._id);
    
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100);
    
    console.log(`✅ Found ${notifications.length} notifications`);
    
    res.json({ success: true, notifications });
  } catch (err) {
    console.error('❌ Failed to fetch notifications:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
});

// Mark a notification as read
router.patch('/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { $set: { read: true } },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, notification });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update notification' });
  }
});

// Mark all notifications as read
router.patch('/read-all', protect, async (req, res) => {
  try {
    await Notification.updateMany(
      { user: req.user._id, read: false }, 
      { $set: { read: true } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to mark all as read' });
  }
});

// Delete a notification
router.delete('/:id', protect, async (req, res) => {
  try {
    const result = await Notification.deleteOne({ 
      _id: req.params.id, 
      user: req.user._id 
    });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete notification' });
  }
});

// 🧪 DEBUG: Test notification endpoint
// Remove this in production!
router.post('/test', protect, async (req, res) => {
  try {
    console.log('🧪 Creating test notification for user:', req.user._id);
    
    const io = req.app.get('io');
    
    const notification = await createNotification(
      req.user._id,
      'test',
      `Test notification created at ${new Date().toLocaleTimeString()}`,
      { test: true },
      io
    );
    
    console.log('✅ Test notification created:', notification._id);
    
    res.json({ 
      success: true, 
      message: 'Test notification sent',
      notification 
    });
  } catch (err) {
    console.error('❌ Test notification error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 🧪 DEBUG: Check notification count in DB
router.get('/debug/count', protect, async (req, res) => {
  try {
    const total = await Notification.countDocuments({ user: req.user._id });
    const unread = await Notification.countDocuments({ user: req.user._id, read: false });
    const read = await Notification.countDocuments({ user: req.user._id, read: true });
    
    console.log('📊 Notification counts:', { total, unread, read });
    
    res.json({ 
      success: true, 
      counts: { total, unread, read },
      userId: req.user._id
    });
  } catch (err) {
    console.error('❌ Debug count error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// 🧪 DEBUG: Get sample notifications
router.get('/debug/sample', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();
    
    console.log('📋 Sample notifications:', notifications.length);
    
    res.json({ 
      success: true, 
      notifications,
      userId: req.user._id
    });
  } catch (err) {
    console.error('❌ Debug sample error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;