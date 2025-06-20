const { v4: uuidv4 } = require('uuid');

class NotificationService {
  constructor(em, notificationRepository, userRepository, holdRepository, watchListRepository) {
    this.em = em;
    this.notificationRepository = notificationRepository;
    this.userRepository = userRepository;
    this.holdRepository = holdRepository;
    this.watchListRepository = watchListRepository;
  }

  async createNotification(userId, type, title, message, relatedEntityType = null, relatedEntityId = null, priority = 'normal', metadata = {}) {
    try {
      const user = await this.userRepository.findOne({ id: userId });
      if (!user) {
        throw new Error('User not found ' + userId);
      }

      const notification = new this.notificationRepository.entity(
        userId,
        type,
        title,
        message,
        relatedEntityType,
        relatedEntityId,
        priority
      );

      notification.metadata = metadata;
      await this.notificationRepository.persistAndFlush(notification);

      return notification;
    } catch (error) {
      throw new Error(`(with userId ${userId} and type ${type} and title ${title} and message ${message} and relatedEntityType ${relatedEntityType} and relatedEntityId ${relatedEntityId} and priority ${priority} and metadata ${metadata}) Failed to create notification: ${error.message}`);
    }
  }

  async getUserNotifications(userId, page = 1, limit = 20, unreadOnly = false) {
    try {
      const offset = (page - 1) * limit;
      const where = { userId };
      
      if (unreadOnly) {
        where.read = false;
      }

      const notifications = await this.notificationRepository.find(
        where,
        { 
          orderBy: { createdAt: 'DESC' },
          limit,
          offset
        }
      );

      const total = await this.notificationRepository.count(where);

      return {
        notifications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`(with userId ${userId} and page ${page} and limit ${limit} and unreadOnly ${unreadOnly}) Failed to get user notifications: ${error.message}`);
    }
  }

  async markAsRead(notificationId, userId) {
    try {
      const notification = await this.notificationRepository.findOne({ id: notificationId });
      if (!notification) {
        throw new Error('Notification not found ' + notificationId);
      }

      if (notification.userId !== userId) {
        throw new Error('Unauthorized to mark this notification as read ' + notificationId);
      }

      notification.read = true;
      notification.readAt = new Date();
      await this.notificationRepository.persistAndFlush(notification);

      return notification;
    } catch (error) {
      throw new Error(`(with notificationId ${notificationId} and userId ${userId}) Failed to mark notification as read: ${error.message}`);
    }
  }

  async markAllAsRead(userId) {
    try {
      await this.notificationRepository.nativeUpdate(
        { userId, read: false },
        { read: true, readAt: new Date() }
      );

      return { success: true };
    } catch (error) {
      throw new Error(`(with userId ${userId}) Failed to mark all notifications as read: ${error.message}`);
    }
  }

  async deleteNotification(notificationId, userId) {
    try {
      const notification = await this.notificationRepository.findOne({ id: notificationId });
      if (!notification) {
        throw new Error('Notification not found ' + notificationId);
      }

      if (notification.userId !== userId) {
        throw new Error('Unauthorized to delete this notification ' + notificationId);
      }

      await this.notificationRepository.removeAndFlush(notification);
      return { success: true };
    } catch (error) {
      throw new Error(`(with notificationId ${notificationId} and userId ${userId}) Failed to delete notification: ${error.message}`);
    }
  }

  async getUnreadCount(userId) {
    try {
      const count = await this.notificationRepository.count({ userId, read: false });
      return count;
    } catch (error) {
      throw new Error(`(with userId ${userId}) Failed to get unread count: ${error.message}`);
    }
  }

  // Hold-related notifications
  async sendHoldReminders() {
    try {
      const now = new Date();
      const activeHolds = await this.holdRepository.find({ status: 'active' });

      for (const hold of activeHolds) {
        const holdAge = Math.floor((now - hold.holdDate) / (1000 * 60 * 60 * 24));
        
        // Check minimum keep time notification
        if (!hold.minKeepTimeNotified && holdAge >= hold.minKeepTime) {
          await this.createNotification(
            hold.userId,
            'hold_min_time_reached',
            'Minimum Hold Time Reached',
            `Your hold for item #${hold.itemId} has reached the minimum keep time of ${hold.minKeepTime} days. You can now release it if desired.`,
            'hold',
            hold.id,
            'normal'
          );
          
          hold.minKeepTimeNotified = true;
          hold.keepTimeReminders.push(new Date());
          await this.holdRepository.persistAndFlush(hold);
        }

        // Check maximum keep time notification
        if (!hold.maxKeepTimeNotified && holdAge >= hold.maxKeepTime) {
          await this.createNotification(
            hold.userId,
            'hold_max_time_reached',
            'Maximum Hold Time Reached',
            `Your hold for item #${hold.itemId} has reached the maximum keep time of ${hold.maxKeepTime} days. Please release it soon.`,
            'hold',
            hold.id,
            'high'
          );
          
          hold.maxKeepTimeNotified = true;
          hold.keepTimeReminders.push(new Date());
          await this.holdRepository.persistAndFlush(hold);
        }

        // Weekly reminder for long holds
        if (holdAge > 7 && holdAge % 7 === 0) {
          const lastReminder = hold.keepTimeReminders[hold.keepTimeReminders.length - 1];
          const daysSinceLastReminder = lastReminder ? 
            Math.floor((now - lastReminder) / (1000 * 60 * 60 * 24)) : 8;
          
          if (daysSinceLastReminder >= 7) {
            await this.createNotification(
              hold.userId,
              'hold_reminder',
              'Hold Reminder',
              `Your hold for item #${hold.itemId} has been active for ${holdAge} days. Consider releasing it if no longer needed.`,
              'hold',
              hold.id,
              'normal'
            );
            
            hold.keepTimeReminders.push(new Date());
            await this.holdRepository.persistAndFlush(hold);
          }
        }
      }
    } catch (error) {
      console.error('(with holdId ' + hold.id + ') Failed to send hold reminders:', error);
    }
  }

  // Watch list notifications
  async sendWatchListNotifications() {
    try {
      const watchLists = await this.watchListRepository.findAll();
      
      for (const watch of watchLists) {
        const item = await this.em.findOne('Item', { id: watch.itemId });
        if (!item) continue;

        const user = await this.userRepository.findOne({ id: watch.userId });
        if (!user) continue;

        const lastNotified = watch.lastNotifiedAt;
        const now = new Date();
        const daysSinceNotification = lastNotified ? 
          Math.floor((now - lastNotified) / (1000 * 60 * 60 * 24)) : 999;

        // Price change notification (if enabled and price changed)
        if (watch.notificationPreferences.priceChanges && 
            item.lastPriceChange && 
            item.lastPriceChange > lastNotified) {
          await this.createNotification(
            watch.userId,
            'watch_price_change',
            'Price Change on Watched Item',
            `The price of "${item.title}" has changed. Check it out!`,
            'item',
            item.id,
            'normal',
            { oldPrice: item.previousPrice, newPrice: item.price }
          );
          
          watch.lastNotifiedAt = now;
          await this.watchListRepository.persistAndFlush(watch);
        }

        // Availability notification (if enabled and item became available)
        if (watch.notificationPreferences.availability && 
            item.status === 'available' && 
            daysSinceNotification > 1) {
          await this.createNotification(
            watch.userId,
            'watch_availability',
            'Watched Item Available',
            `"${item.title}" is now available for holds!`,
            'item',
            item.id,
            'normal'
          );
          
          watch.lastNotifiedAt = now;
          await this.watchListRepository.persistAndFlush(watch);
        }

        // New holds notification (if enabled)
        if (watch.notificationPreferences.newHolds && 
            item.holdCount > 0 && 
            daysSinceNotification > 1) {
          await this.createNotification(
            watch.userId,
            'watch_new_holds',
            'New Holds on Watched Item',
            `"${item.title}" now has ${item.holdCount} active holds.`,
            'item',
            item.id,
            'low'
          );
          
          watch.lastNotifiedAt = now;
          await this.watchListRepository.persistAndFlush(watch);
        }
      }
    } catch (error) {
      console.error('(with watchId ' + watch.id + ') Failed to send watch list notifications:', error);
    }
  }

  // Dispute notifications
  async sendDisputeNotifications(dispute, hold, item) {
    try {
      const allParties = [hold.userId, item.listedBy];
      
      for (const partyId of allParties) {
        if (partyId !== dispute.initiatedBy) {
          await this.createNotification(
            partyId,
            'dispute_created',
            'New Dispute Created',
            `A dispute has been created for hold #${hold.id} regarding "${item.title}"`,
            'dispute',
            dispute.id,
            'high'
          );
        }
      }
    } catch (error) {
      console.error('(with holdId ' + hold.id + ' and itemId ' + item.id + ' and disputeId ' + dispute.id + ') Failed to send dispute notifications:', error);
    }
  }

  // System notifications
  async sendSystemNotification(userId, title, message, priority = 'normal') {
    try {
      return await this.createNotification(
        userId,
        'system',
        title,
        message,
        null,
        null,
        priority
      );
    } catch (error) {
      throw new Error(`(with userId ${userId} and title ${title} and message ${message} and priority ${priority}) Failed to send system notification: ${error.message}`);
    }
  }

  // Bulk notifications
  async sendBulkNotification(userIds, title, message, priority = 'normal') {
    try {
      const notifications = [];
      
      for (const userId of userIds) {
        const notification = await this.createNotification(
          userId,
          'system',
          title,
          message,
          null,
          null,
          priority
        );
        notifications.push(notification);
      }
      
      return notifications;
    } catch (error) {
      throw new Error(`(with userIds ${userIds} and title ${title} and message ${message} and priority ${priority}) Failed to send bulk notifications: ${error.message}`);
    }
  }

  // Notification preferences
  async updateNotificationPreferences(userId, preferences) {
    try {
      const user = await this.userRepository.findOne({ id: userId });
      if (!user) {
        throw new Error('User not found');
      }

      user.notificationPreferences = {
        ...user.notificationPreferences,
        ...preferences
      };

      await this.userRepository.persistAndFlush(user);
      return user.notificationPreferences;
    } catch (error) {
      throw new Error(`(with userId ${userId} and preferences ${preferences}) Failed to update notification preferences: ${error.message}`);
    }
  }

  async getNotificationStats(userId) {
    try {
      const total = await this.notificationRepository.count({ userId });
      const unread = await this.notificationRepository.count({ userId, read: false });
      const byType = await this.notificationRepository.count({ userId }, { groupBy: 'type' });

      return {
        total,
        unread,
        byType,
        readRate: total > 0 ? ((total - unread) / total * 100).toFixed(2) : 0
      };
    } catch (error) {
      throw new Error(`(with userId ${userId}) Failed to get notification stats: ${error.message}`);
    }
  }
}

module.exports = NotificationService; 