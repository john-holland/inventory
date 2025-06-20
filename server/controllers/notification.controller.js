const express = require('express');
const router = express.Router();

class NotificationController {
  constructor(notificationService, authMiddleware) {
    this.notificationService = notificationService;
    this.authMiddleware = authMiddleware;
    this.setupRoutes();
  }

  setupRoutes() {
    // Get user notifications
    router.get('/user', 
      this.authMiddleware.requireAuth,
      this.getUserNotifications.bind(this)
    );

    // Get unread count
    router.get('/unread-count', 
      this.authMiddleware.requireAuth,
      this.getUnreadCount.bind(this)
    );

    // Mark notification as read
    router.post('/mark-read/:notificationId', 
      this.authMiddleware.requireAuth,
      this.markAsRead.bind(this)
    );

    // Mark all notifications as read
    router.post('/mark-all-read', 
      this.authMiddleware.requireAuth,
      this.markAllAsRead.bind(this)
    );

    // Delete notification
    router.delete('/:notificationId', 
      this.authMiddleware.requireAuth,
      this.deleteNotification.bind(this)
    );

    // Update notification preferences
    router.put('/preferences', 
      this.authMiddleware.requireAuth,
      this.updatePreferences.bind(this)
    );

    // Get notification stats
    router.get('/stats', 
      this.authMiddleware.requireAuth,
      this.getNotificationStats.bind(this)
    );

    // Send system notification (admin only)
    router.post('/system', 
      this.authMiddleware.requireAuth,
      this.authMiddleware.requireAdmin,
      this.sendSystemNotification.bind(this)
    );

    // Send bulk notification (admin only)
    router.post('/bulk', 
      this.authMiddleware.requireAuth,
      this.authMiddleware.requireAdmin,
      this.sendBulkNotification.bind(this)
    );
  }

  async getUserNotifications(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20, unreadOnly = false } = req.query;

      const result = await this.notificationService.getUserNotifications(
        userId,
        parseInt(page),
        parseInt(limit),
        unreadOnly === 'true'
      );

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('(with userId ' + userId + ' and page ' + page + ' and limit ' + limit + ' and unreadOnly ' + unreadOnly + ') Get user notifications error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async getUnreadCount(req, res) {
    try {
      const userId = req.user.id;
      const count = await this.notificationService.getUnreadCount(userId);

      res.json({
        success: true,
        unreadCount: count
      });
    } catch (error) {
      console.error('(with userId ' + userId + ') Get unread count error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async markAsRead(req, res) {
    try {
      const { notificationId } = req.params;
      const userId = req.user.id;

      const notification = await this.notificationService.markAsRead(notificationId, userId);

      res.json({
        success: true,
        message: 'Notification marked as read',
        notification
      });
    } catch (error) {
      console.error('(with notificationId ' + notificationId + ' and userId ' + userId + ') Mark as read error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async markAllAsRead(req, res) {
    try {
      const userId = req.user.id;

      await this.notificationService.markAllAsRead(userId);

      res.json({
        success: true,
        message: 'All notifications marked as read'
      });
    } catch (error) {
      console.error('(with userId ' + userId + ') Mark all as read error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async deleteNotification(req, res) {
    try {
      const { notificationId } = req.params;
      const userId = req.user.id;

      await this.notificationService.deleteNotification(notificationId, userId);

      res.json({
        success: true,
        message: 'Notification deleted successfully'
      });
    } catch (error) {
      console.error('(with notificationId ' + notificationId + ' and userId ' + userId + ') Delete notification error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async updatePreferences(req, res) {
    try {
      const userId = req.user.id;
      const preferences = req.body;

      const updatedPreferences = await this.notificationService.updateNotificationPreferences(
        userId,
        preferences
      );

      res.json({
        success: true,
        message: 'Notification preferences updated',
        preferences: updatedPreferences
      });
    } catch (error) {
      console.error('(with userId ' + userId + ' and preferences ' + preferences + ') Update preferences error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async getNotificationStats(req, res) {
    try {
      const userId = req.user.id;
      const stats = await this.notificationService.getNotificationStats(userId);

      res.json({
        success: true,
        stats
      });
    } catch (error) {
      console.error('(with userId ' + userId + ') Get notification stats error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async sendSystemNotification(req, res) {
    try {
      const { userId, title, message, priority = 'normal' } = req.body;

      if (!userId || !title || !message) {
        return res.status(400).json({ error: 'User ID, title, and message are required' });
      }

      const notification = await this.notificationService.sendSystemNotification(
        userId,
        title,
        message,
        priority
      );

      res.json({
        success: true,
        message: 'System notification sent successfully',
        notification
      });
    } catch (error) {
      console.error('(with userId ' + userId + ' and title ' + title + ' and message ' + message + ' and priority ' + priority + ') Send system notification error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async sendBulkNotification(req, res) {
    try {
      const { userIds, title, message, priority = 'normal' } = req.body;

      if (!userIds || !Array.isArray(userIds) || !title || !message) {
        return res.status(400).json({ error: 'User IDs array, title, and message are required for userIds ' + userIds + ' and title ' + title + ' and message ' + message + ' and priority ' + priority });
      }

      const notifications = await this.notificationService.sendBulkNotification(
        userIds,
        title,
        message,
        priority
      );

      res.json({
        success: true,
        message: `Bulk notification sent to ${notifications.length} users`,
        notifications
      });
    } catch (error) {
      console.error('(with userIds ' + userIds + ' and title ' + title + ' and message ' + message + ' and priority ' + priority + ') Send bulk notification error:', error);
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = { NotificationController, router }; 