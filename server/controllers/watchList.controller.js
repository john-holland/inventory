const express = require('express');
const router = express.Router();

class WatchListController {
  constructor(watchListService, authMiddleware) {
    this.watchListService = watchListService;
    this.authMiddleware = authMiddleware;
    this.setupRoutes();
  }

  setupRoutes() {
    // Add item to watch list
    router.post('/add/:itemId', 
      this.authMiddleware.requireAuth,
      this.addToWatchList.bind(this)
    );

    // Remove item from watch list
    router.delete('/remove/:itemId', 
      this.authMiddleware.requireAuth,
      this.removeFromWatchList.bind(this)
    );

    // Get user's watch list
    router.get('/user', 
      this.authMiddleware.requireAuth,
      this.getUserWatchList.bind(this)
    );

    // Check if item is watched
    router.get('/check/:itemId', 
      this.authMiddleware.requireAuth,
      this.checkIfWatched.bind(this)
    );

    // Update watch preferences
    router.put('/preferences/:itemId', 
      this.authMiddleware.requireAuth,
      this.updateWatchPreferences.bind(this)
    );

    // Get watch list stats
    router.get('/stats', 
      this.authMiddleware.requireAuth,
      this.getWatchListStats.bind(this)
    );

    // Bulk add items to watch list
    router.post('/bulk-add', 
      this.authMiddleware.requireAuth,
      this.bulkAddToWatchList.bind(this)
    );

    // Bulk remove items from watch list
    router.post('/bulk-remove', 
      this.authMiddleware.requireAuth,
      this.bulkRemoveFromWatchList.bind(this)
    );
  }

  async addToWatchList(req, res) {
    try {
      const { itemId } = req.params;
      const { notificationPreferences, watchReason, notes } = req.body;
      const userId = req.user.id;

      const watchItem = await this.watchListService.addToWatchList(
        userId,
        itemId,
        notificationPreferences,
        watchReason,
        notes
      );

      res.status(201).json({
        success: true,
        message: 'Item added to watch list',
        watchItem
      });
    } catch (error) {
      console.error('(with itemId ' + itemId + ' and notificationPreferences ' + notificationPreferences + ' and watchReason ' + watchReason + ' and notes ' + notes + ' and userId ' + userId + ') Add to watch list error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async removeFromWatchList(req, res) {
    try {
      const { itemId } = req.params;
      const userId = req.user.id;

      await this.watchListService.removeFromWatchList(userId, itemId);

      res.json({
        success: true,
        message: 'Item removed from watch list'
      });
    } catch (error) {
      console.error('(with itemId ' + itemId + ' and userId ' + userId + ') Remove from watch list error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async getUserWatchList(req, res) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20, sortBy = 'watchDate', sortOrder = 'desc' } = req.query;

      const result = await this.watchListService.getUserWatchList(
        userId,
        parseInt(page),
        parseInt(limit),
        sortBy,
        sortOrder
      );

      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      console.error('(with userId ' + userId + ' and page ' + page + ' and limit ' + limit + ' and sortBy ' + sortBy + ' and sortOrder ' + sortOrder + ') Get user watch list error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async checkIfWatched(req, res) {
    try {
      const { itemId } = req.params;
      const userId = req.user.id;

      const isWatched = await this.watchListService.checkIfWatched(userId, itemId);

      res.json({
        success: true,
        isWatched
      });
    } catch (error) {
      console.error('(with itemId ' + itemId + ' and userId ' + userId + ') Check if watched error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async updateWatchPreferences(req, res) {
    try {
      const { itemId } = req.params;
      const { notificationPreferences, notes } = req.body;
      const userId = req.user.id;

      const updatedWatch = await this.watchListService.updateWatchPreferences(
        userId,
        itemId,
        notificationPreferences,
        notes
      );

      res.json({
        success: true,
        message: 'Watch preferences updated',
        watchItem: updatedWatch
      });
    } catch (error) {
      console.error('(with itemId ' + itemId + ' and notificationPreferences ' + notificationPreferences + ' and notes ' + notes + ' and userId ' + userId + ') Update watch preferences error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async getWatchListStats(req, res) {
    try {
      const userId = req.user.id;
      const stats = await this.watchListService.getWatchListStats(userId);

      res.json({
        success: true,
        stats
      });
    } catch (error) {
      console.error('(with userId ' + userId + ') Get watch list stats error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async bulkAddToWatchList(req, res) {
    try {
      const { itemIds, notificationPreferences } = req.body;
      const userId = req.user.id;

      if (!itemIds || !Array.isArray(itemIds)) {
        return res.status(400).json({ error: 'Item IDs array is required' });
      }

      const results = await this.watchListService.bulkAddToWatchList(
        userId,
        itemIds,
        notificationPreferences
      );

      res.json({
        success: true,
        message: `Added ${results.added} items to watch list`,
        results
      });
    } catch (error) {
      console.error('(with itemIds ' + itemIds + ' and notificationPreferences ' + notificationPreferences + ' and userId ' + userId + ') Bulk add to watch list error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async bulkRemoveFromWatchList(req, res) {
    try {
      const { itemIds } = req.body;
      const userId = req.user.id;

      if (!itemIds || !Array.isArray(itemIds)) {
        return res.status(400).json({ error: 'Item IDs array is required' });
      }

      const results = await this.watchListService.bulkRemoveFromWatchList(userId, itemIds);

      res.json({
        success: true,
        message: `Removed ${results.removed} items from watch list`,
        results
      });
    } catch (error) {
      console.error('(with itemIds ' + itemIds + ' and userId ' + userId + ') Bulk remove from watch list error:', error);
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = { WatchListController, router }; 