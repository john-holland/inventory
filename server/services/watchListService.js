class WatchListService {
  constructor(em, watchListRepository, userRepository, itemRepository, notificationService) {
    this.em = em;
    this.watchListRepository = watchListRepository;
    this.userRepository = userRepository;
    this.itemRepository = itemRepository;
    this.notificationService = notificationService;
  }

  async addToWatchList(userId, itemId, notificationPreferences = {}, watchReason = '', notes = '') {
    try {
      const user = await this.userRepository.findOne({ id: userId });
      if (!user) {
        throw new Error('User not found ' + userId);
      }

      const item = await this.itemRepository.findOne({ id: itemId });
      if (!item) {
        throw new Error('Item not found ' + itemId + ' with userId ' + userId);
      }

      // Check if already watching
      const existingWatch = await this.watchListRepository.findOne({ userId, itemId });
      if (existingWatch) {
        throw new Error('Item is already in your watch list ' + itemId + ' with userId ' + userId);
      }

      const watchItem = new this.watchListRepository.entity(userId, itemId, notificationPreferences);
      watchItem.metadata.watchReason = watchReason;
      watchItem.metadata.notes = notes;

      await this.watchListRepository.persistAndFlush(watchItem);

      return watchItem;
    } catch (error) {
      throw new Error(`(with userId ${userId} and itemId ${itemId} and notificationPreferences ${notificationPreferences} and watchReason ${watchReason} and notes ${notes}) Failed to add to watch list: ${error.message}`);
    }
  }

  async removeFromWatchList(userId, itemId) {
    try {
      const watchItem = await this.watchListRepository.findOne({ userId, itemId });
      if (!watchItem) {
        throw new Error('Item not found in watch list ' + itemId + ' with userId ' + userId);
      }

      await this.watchListRepository.removeAndFlush(watchItem);
      return { success: true };
    } catch (error) {
      throw new Error(`(with userId ${userId} and itemId ${itemId}) Failed to remove from watch list: ${error.message}`);
    }
  }

  async getUserWatchList(userId, page = 1, limit = 20, sortBy = 'watchDate', sortOrder = 'desc') {
    try {
      const offset = (page - 1) * limit;
      const orderBy = { [sortBy]: sortOrder === 'desc' ? 'DESC' : 'ASC' };

      const watchItems = await this.watchListRepository.find(
        { userId },
        { 
          orderBy,
          limit,
          offset,
          populate: ['itemId']
        }
      );

      const total = await this.watchListRepository.count({ userId });

      return {
        watchItems,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw new Error(`(with userId ${userId} and page ${page} and limit ${limit} and sortBy ${sortBy} and sortOrder ${sortOrder}) Failed to get user watch list: ${error.message}`);
    }
  }

  async checkIfWatched(userId, itemId) {
    try {
      const watchItem = await this.watchListRepository.findOne({ userId, itemId });
      return !!watchItem;
    } catch (error) {
      throw new Error(`(with userId ${userId} and itemId ${itemId}) Failed to check if watched: ${error.message}`);
    }
  }

  async updateWatchPreferences(userId, itemId, notificationPreferences = {}, notes = '') {
    try {
      const watchItem = await this.watchListRepository.findOne({ userId, itemId });
      if (!watchItem) {
        throw new Error('Item not found in watch list ' + itemId + ' with userId ' + userId);
      }

      watchItem.notificationPreferences = {
        ...watchItem.notificationPreferences,
        ...notificationPreferences
      };

      if (notes !== undefined) {
        watchItem.metadata.notes = notes;
      }

      await this.watchListRepository.persistAndFlush(watchItem);
      return watchItem;
    } catch (error) {
      throw new Error(`(with userId ${userId} and itemId ${itemId} and notificationPreferences ${notificationPreferences} and notes ${notes}) Failed to update watch preferences: ${error.message}`);
    }
  }

  async getWatchListStats(userId) {
    try {
      const totalWatched = await this.watchListRepository.count({ userId });
      
      // Get items with different notification preferences
      const watchItems = await this.watchListRepository.find({ userId });
      
      const stats = {
        totalWatched,
        byNotificationType: {
          priceChanges: 0,
          availability: 0,
          newHolds: 0,
          itemUpdates: 0
        },
        recentlyAdded: 0,
        activeNotifications: 0
      };

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      watchItems.forEach(item => {
        // Count notification preferences
        if (item.notificationPreferences.priceChanges) stats.byNotificationType.priceChanges++;
        if (item.notificationPreferences.availability) stats.byNotificationType.availability++;
        if (item.notificationPreferences.newHolds) stats.byNotificationType.newHolds++;
        if (item.notificationPreferences.itemUpdates) stats.byNotificationType.itemUpdates++;

        // Count recently added
        if (item.watchDate > thirtyDaysAgo) {
          stats.recentlyAdded++;
        }
      });

      return stats;
    } catch (error) {
      throw new Error(`(with userId ${userId}) Failed to get watch list stats: ${error.message}`);
    }
  }

  async bulkAddToWatchList(userId, itemIds, notificationPreferences = {}) {
    try {
      const results = {
        added: 0,
        alreadyWatched: 0,
        notFound: 0,
        errors: []
      };

      for (const itemId of itemIds) {
        try {
          const existingWatch = await this.watchListRepository.findOne({ userId, itemId });
          if (existingWatch) {
            results.alreadyWatched++;
            continue;
          }

          const item = await this.itemRepository.findOne({ id: itemId });
          if (!item) {
            results.notFound++;
            continue;
          }

          const watchItem = new this.watchListRepository.entity(userId, itemId, notificationPreferences);
          await this.watchListRepository.persistAndFlush(watchItem);
          results.added++;
        } catch (error) {
          results.errors.push({ itemId, error: error.message });
        }
      }

      return results;
    } catch (error) {
      throw new Error(`(with userId ${userId} and itemIds ${itemIds} and notificationPreferences ${notificationPreferences}) Failed to bulk add to watch list: ${error.message}`);
    }
  }

  async bulkRemoveFromWatchList(userId, itemIds) {
    try {
      const results = {
        removed: 0,
        notFound: 0,
        errors: []
      };

      for (const itemId of itemIds) {
        try {
          const watchItem = await this.watchListRepository.findOne({ userId, itemId });
          if (!watchItem) {
            results.notFound++;
            continue;
          }

          await this.watchListRepository.removeAndFlush(watchItem);
          results.removed++;
        } catch (error) {
          results.errors.push({ itemId, error: error.message });
        }
      }

      return results;
    } catch (error) {
      throw new Error(`(with userId ${userId} and itemIds ${itemIds}) Failed to bulk remove from watch list: ${error.message}`);
    }
  }

  async getWatchedItemsWithUpdates(userId) {
    try {
      const watchItems = await this.watchListRepository.find(
        { userId },
        { populate: ['itemId'] }
      );

      const itemsWithUpdates = [];

      for (const watchItem of watchItems) {
        const item = watchItem.itemId;
        let hasUpdates = false;
        let updateType = '';

        // Check for price changes
        if (watchItem.notificationPreferences.priceChanges && 
            item.lastPriceChange && 
            item.lastPriceChange > watchItem.lastNotifiedAt) {
          hasUpdates = true;
          updateType = 'price_change';
        }

        // Check for availability changes
        if (watchItem.notificationPreferences.availability && 
            item.status === 'available' && 
            (!watchItem.lastNotifiedAt || item.updatedAt > watchItem.lastNotifiedAt)) {
          hasUpdates = true;
          updateType = 'availability';
        }

        // Check for new holds
        if (watchItem.notificationPreferences.newHolds && 
            item.holdCount > 0 && 
            (!watchItem.lastNotifiedAt || item.updatedAt > watchItem.lastNotifiedAt)) {
          hasUpdates = true;
          updateType = 'new_holds';
        }

        if (hasUpdates) {
          itemsWithUpdates.push({
            watchItem,
            item,
            updateType
          });
        }
      }

      return itemsWithUpdates;
    } catch (error) {
      throw new Error(`(with userId ${userId}) Failed to get watched items with updates: ${error.message}`);
    }
  }

  async markItemAsNotified(userId, itemId) {
    try {
      const watchItem = await this.watchListRepository.findOne({ userId, itemId });
      if (!watchItem) {
        throw new Error('Watch item not found ' + itemId + ' with userId ' + userId);
      }

      watchItem.lastNotifiedAt = new Date();
      await this.watchListRepository.persistAndFlush(watchItem);

      return watchItem;
    } catch (error) {
      throw new Error(`(with userId ${userId} and itemId ${itemId}) Failed to mark item as notified: ${error.message}`);
    }
  }
}

module.exports = WatchListService; 