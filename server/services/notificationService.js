// services/notificationService.js
const emailService = require('./emailService');
const smsService = require('./smsService');
const { emitToUser, emitToRole, notifyIssueStatusUpdate } = require('../config/socket');
const { createNotification } = require('../utils/notificationUtils');

// Unified notification service
class NotificationService {
  constructor(io) {
    this.io = io;
    console.log('✅ NotificationService initialized with Socket.IO');
  }

  // Send issue status update notifications
  async notifyIssueStatusChange(issue, oldStatus, newStatus, updatedBy, adminNotes = '') {
    const notifications = [];
    try {
      console.log(`📢 Notifying status change for issue ${issue._id}: ${oldStatus} → ${newStatus}`);
      
      // Get reporter details - FIX: Check if already populated
      let reporter;
      if (issue.reporter && issue.reporter._id) {
        reporter = issue.reporter;
      } else {
        const populatedIssue = await issue.populate('reporter');
        reporter = populatedIssue.reporter;
      }

      if (!reporter) {
        console.error('❌ Reporter not found for issue:', issue._id);
        throw new Error('Reporter not found');
      }

      console.log('👤 Reporter:', reporter._id, reporter.name);

      // 1. Save notification to DB and emit via Socket.IO
      if (this.io) {
        const message = `Your issue "${issue.title}" status changed to ${newStatus}.`;
        
        // FIX: Pass io instance to createNotification
        const notification = await createNotification(
          reporter._id,
          'status_update',
          message,
          { issueId: issue._id, oldStatus, newStatus, adminNotes },
          this.io  // ✅ Pass Socket.IO instance
        );
        
        notifications.push({ type: 'realtime', success: true, notificationId: notification._id });
        console.log('✅ Real-time notification sent to user:', reporter._id);
        
        // Also use the socket helper for additional notifications
        notifyIssueStatusUpdate(this.io, issue, oldStatus, newStatus, updatedBy);
      }

      // 2. Email notification
      const emailResult = await emailService.sendIssueStatusEmail(
        reporter, 
        issue, 
        newStatus, 
        adminNotes
      );
      notifications.push({ type: 'email', ...emailResult });
      console.log('📧 Email notification:', emailResult.success ? 'sent' : 'failed');

      // 3. SMS notification (if enabled)
      if (reporter.phone && reporter.preferences?.smsNotifications) {
        const smsResult = await smsService.sendIssueStatusSMS(
          reporter, 
          issue, 
          newStatus
        );
        notifications.push({ type: 'sms', ...smsResult });
        console.log('📱 SMS notification:', smsResult.success ? 'sent' : 'failed');
      }

      const summary = {
        total: notifications.length,
        successful: notifications.filter(n => n.success).length,
        failed: notifications.filter(n => !n.success).length
      };

      console.log('📊 Notification summary:', summary);

      return {
        success: true,
        notifications,
        summary
      };

    } catch (error) {
      console.error('❌ Notification service error:', error);
      return {
        success: false,
        error: error.message,
        notifications
      };
    }
  }

  // Send new issue notifications to authorities
  async notifyNewIssue(issue, authorities) {
    const notifications = [];

    try {
      console.log(`📢 Notifying ${authorities.length} authorities about new issue ${issue._id}`);

      for (const authority of authorities) {
        // Email notification
        const emailResult = await emailService.sendAuthorityNotificationEmail(
          authority, 
          issue
        );
        notifications.push({ 
          type: 'email', 
          authority: authority.name, 
          ...emailResult 
        });

        // SMS notification
        const smsResult = await smsService.sendAuthorityNotificationSMS(
          authority, 
          issue
        );
        notifications.push({ 
          type: 'sms', 
          authority: authority.name, 
          ...smsResult 
        });
      }

      // Real-time notification to admins
      if (this.io) {
        this.io.to('role_admin').emit('new_issue_submitted', {
          issueId: issue._id,
          title: issue.title,
          category: issue.category,
          priority: issue.priority,
          reporter: issue.reporter.name,
          location: issue.location,
          timestamp: new Date()
        });
        console.log('✅ Admin notification emitted');
      }

      return {
        success: true,
        notifications,
        summary: {
          total: notifications.length,
          successful: notifications.filter(n => n.success).length,
          failed: notifications.filter(n => !n.success).length
        }
      };

    } catch (error) {
      console.error('❌ New issue notification error:', error);
      return {
        success: false,
        error: error.message,
        notifications
      };
    }
  }

  // Send urgent issue alerts
  async sendUrgentAlert(issue, emergencyContacts) {
    const notifications = [];

    try {
      console.log(`🚨 Sending urgent alerts for issue ${issue._id}`);

      for (const contact of emergencyContacts) {
        // Emergency SMS
        const smsResult = await smsService.sendUrgentIssueAlertSMS(
          contact, 
          issue
        );
        notifications.push({ 
          type: 'urgent_sms', 
          contact: contact.name, 
          ...smsResult 
        });

        // Emergency email
        const emailResult = await emailService.sendAuthorityNotificationEmail(
          contact, 
          issue
        );
        notifications.push({ 
          type: 'urgent_email', 
          contact: contact.name, 
          ...emailResult 
        });
      }

      // Real-time urgent alert
      if (this.io) {
        this.io.emit('urgent_issue_alert', {
          issueId: issue._id,
          title: issue.title,
          location: issue.location,
          priority: issue.priority,
          timestamp: new Date()
        });
      }

      return {
        success: true,
        notifications,
        summary: {
          total: notifications.length,
          successful: notifications.filter(n => n.success).length,
          failed: notifications.filter(n => !n.success).length
        }
      };

    } catch (error) {
      console.error('❌ Urgent alert error:', error);
      return {
        success: false,
        error: error.message,
        notifications
      };
    }
  }

  // Send welcome notification to new users
  async sendWelcomeNotification(user) {
    const notifications = [];

    try {
      console.log(`👋 Sending welcome notification to ${user.email}`);

      // Welcome email
      const emailResult = await emailService.sendWelcomeEmail(user);
      notifications.push({ type: 'welcome_email', ...emailResult });

      // Welcome SMS (optional)
      if (user.phone && user.preferences?.smsNotifications) {
        const message = `Welcome to Voice2Action! 🎉 Start reporting issues and help improve your community. Download the app: ${process.env.CLIENT_URL}`;
        const smsResult = await smsService.sendSMS(user.phone, message);
        notifications.push({ type: 'welcome_sms', ...smsResult });
      }

      // Real-time welcome message and DB notification
      if (this.io) {
        await createNotification(
          user._id,
          'welcome',
          'Welcome to Voice2Action! Ready to make a difference?',
          {},
          this.io
        );
      }

      return {
        success: true,
        notifications,
        summary: {
          total: notifications.length,
          successful: notifications.filter(n => n.success).length,
          failed: notifications.filter(n => !n.success).length
        }
      };

    } catch (error) {
      console.error('❌ Welcome notification error:', error);
      return {
        success: false,
        error: error.message,
        notifications
      };
    }
  }

  // Send monthly reports
  async sendMonthlyReports(users, reportData) {
    const notifications = [];

    try {
      console.log(`📊 Sending monthly reports to ${users.length} users`);

      for (const user of users) {
        const userReport = reportData.find(r => r.userId.toString() === user._id.toString());
        
        if (userReport && user.preferences?.emailNotifications) {
          const emailResult = await emailService.sendMonthlyReportEmail(user, userReport);
          notifications.push({ 
            type: 'monthly_report', 
            user: user.email, 
            ...emailResult 
          });
        }
      }

      return {
        success: true,
        notifications,
        summary: {
          total: notifications.length,
          successful: notifications.filter(n => n.success).length,
          failed: notifications.filter(n => !n.success).length
        }
      };

    } catch (error) {
      console.error('❌ Monthly report error:', error);
      return {
        success: false,
        error: error.message,
        notifications
      };
    }
  }

  // Send system announcements
  async sendSystemAnnouncement(announcement, targetUsers = null) {
    const notifications = [];

    try {
      console.log('📢 Sending system announcement...');

      // Real-time announcement
      if (this.io) {
        if (targetUsers) {
          for (const userId of targetUsers) {
            await createNotification(
              userId,
              'announcement',
              announcement.message,
              announcement,
              this.io
            );
          }
        } else {
          this.io.emit('system_announcement', announcement);
        }
        notifications.push({ type: 'realtime_announcement', success: true });
      }

      // Email announcement (if specified)
      if (announcement.sendEmail && announcement.recipients) {
        for (const recipient of announcement.recipients) {
          const emailResult = await emailService.sendEmail(
            recipient.email,
            announcement.subject,
            announcement.html
          );
          notifications.push({ 
            type: 'announcement_email', 
            recipient: recipient.email, 
            ...emailResult 
          });
        }
      }

      return {
        success: true,
        notifications,
        summary: {
          total: notifications.length,
          successful: notifications.filter(n => n.success).length,
          failed: notifications.filter(n => !n.success).length
        }
      };

    } catch (error) {
      console.error('❌ System announcement error:', error);
      return {
        success: false,
        error: error.message,
        notifications
      };
    }
  }
}

module.exports = NotificationService;