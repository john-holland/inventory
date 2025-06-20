"use strict";

const express = require('express');
const { MetaMarketplaceService } = require('../services/metaMarketplaceService');

class MetaMarketplaceController {
  constructor(em) {
    this.router = express.Router();
    this.metaMarketplaceService = new MetaMarketplaceService(em);
    this.setupRoutes();
  }

  setupRoutes() {
    // Create a new meta marketplace item
    this.router.post('/items', async (req, res) => {
      try {
        const { userId, ...itemData } = req.body;
        
        if (!userId) {
          return res.status(400).json({
            success: false,
            message: 'Missing required field: userId'
          });
        }

        const item = await this.metaMarketplaceService.createItem(userId, itemData);

        res.status(201).json({
          success: true,
          data: item,
          message: 'Meta marketplace item created successfully'
        });
      } catch (error) {
        console.error('Error creating meta marketplace item:', error);
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to create item'
        });
      }
    });

    // Update a meta marketplace item
    this.router.put('/items/:itemId', async (req, res) => {
      try {
        const { itemId } = req.params;
        const { userId, ...updateData } = req.body;
        
        if (!userId) {
          return res.status(400).json({
            success: false,
            message: 'Missing required field: userId'
          });
        }

        const item = await this.metaMarketplaceService.updateItem(itemId, userId, updateData);

        res.json({
          success: true,
          data: item,
          message: 'Item updated successfully'
        });
      } catch (error) {
        console.error('Error updating meta marketplace item:', error);
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to update item'
        });
      }
    });

    // Delete a meta marketplace item
    this.router.delete('/items/:itemId', async (req, res) => {
      try {
        const { itemId } = req.params;
        const { userId } = req.body;
        
        if (!userId) {
          return res.status(400).json({
            success: false,
            message: 'Missing required field: userId'
          });
        }

        const item = await this.metaMarketplaceService.deleteItem(itemId, userId);

        res.json({
          success: true,
          data: item,
          message: 'Item deleted successfully'
        });
      } catch (error) {
        console.error('Error deleting meta marketplace item:', error);
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to delete item'
        });
      }
    });

    // Get items by user
    this.router.get('/users/:userId/items', async (req, res) => {
      try {
        const { userId } = req.params;
        const { status } = req.query;

        const items = await this.metaMarketplaceService.getItemsByUser(userId, status);

        res.json({
          success: true,
          data: items,
          count: items.length
        });
      } catch (error) {
        console.error('Error getting items by user:', error);
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to get items'
        });
      }
    });

    // Search items
    this.router.get('/items/search', async (req, res) => {
      try {
        const searchParams = {
          category: req.query.category,
          minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : undefined,
          maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : undefined,
          condition: req.query.condition,
          tags: req.query.tags ? req.query.tags.split(',') : undefined,
          searchTerm: req.query.searchTerm,
          limit: req.query.limit ? parseInt(req.query.limit) : 20,
          offset: req.query.offset ? parseInt(req.query.offset) : 0
        };

        const items = await this.metaMarketplaceService.searchItems(searchParams);

        res.json({
          success: true,
          data: items,
          count: items.length,
          searchParams
        });
      } catch (error) {
        console.error('Error searching items:', error);
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to search items'
        });
      }
    });

    // Get alternative items for drop shipping
    this.router.get('/items/alternatives/:amazonProductId', async (req, res) => {
      try {
        const { amazonProductId } = req.params;
        const { category, limit } = req.query;

        const items = await this.metaMarketplaceService.getAlternativeItems(
          amazonProductId,
          category,
          limit ? parseInt(limit) : 10
        );

        res.json({
          success: true,
          data: items,
          count: items.length,
          amazonProductId
        });
      } catch (error) {
        console.error('Error getting alternative items:', error);
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to get alternative items'
        });
      }
    });

    // Get items by category
    this.router.get('/items/category/:category', async (req, res) => {
      try {
        const { category } = req.params;
        const { limit } = req.query;

        const items = await this.metaMarketplaceService.getItemsByCategory(
          category,
          limit ? parseInt(limit) : 20
        );

        res.json({
          success: true,
          data: items,
          count: items.length,
          category
        });
      } catch (error) {
        console.error('Error getting items by category:', error);
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to get items by category'
        });
      }
    });

    // Get item statistics
    this.router.get('/items/statistics', async (req, res) => {
      try {
        const stats = await this.metaMarketplaceService.getItemStatistics();

        res.json({
          success: true,
          data: stats
        });
      } catch (error) {
        console.error('Error getting item statistics:', error);
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to get item statistics'
        });
      }
    });

    // Reserve an item
    this.router.post('/items/:itemId/reserve', async (req, res) => {
      try {
        const { itemId } = req.params;
        const { userId } = req.body;
        
        if (!userId) {
          return res.status(400).json({
            success: false,
            message: 'Missing required field: userId'
          });
        }

        const item = await this.metaMarketplaceService.reserveItem(itemId, userId);

        res.json({
          success: true,
          data: item,
          message: 'Item reserved successfully'
        });
      } catch (error) {
        console.error('Error reserving item:', error);
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to reserve item'
        });
      }
    });

    // Mark item as sold
    this.router.post('/items/:itemId/sold', async (req, res) => {
      try {
        const { itemId } = req.params;
        const { userId } = req.body;
        
        if (!userId) {
          return res.status(400).json({
            success: false,
            message: 'Missing required field: userId'
          });
        }

        const item = await this.metaMarketplaceService.markItemSold(itemId, userId);

        res.json({
          success: true,
          data: item,
          message: 'Item marked as sold successfully'
        });
      } catch (error) {
        console.error('Error marking item as sold:', error);
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to mark item as sold'
        });
      }
    });

    // Get item by ID
    this.router.get('/items/:itemId', async (req, res) => {
      try {
        const { itemId } = req.params;
        const itemRepo = this.metaMarketplaceService.em.getRepository('MetaMarketplaceItem');
        
        const item = await itemRepo.findOne({ id: itemId }, {
          populate: ['userId', 'amazonProductId', 'dropShippingListId']
        });

        if (!item) {
          return res.status(404).json({
            success: false,
            message: 'Item not found'
          });
        }

        res.json({
          success: true,
          data: item
        });
      } catch (error) {
        console.error('Error getting item:', error);
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to get item'
        });
      }
    });

    // Get all categories
    this.router.get('/categories', async (req, res) => {
      try {
        const itemRepo = this.metaMarketplaceService.em.getRepository('MetaMarketplaceItem');
        
        const items = await itemRepo.find({ status: 'active' });
        const categories = [...new Set(items.map(item => item.category))];

        res.json({
          success: true,
          data: categories,
          count: categories.length
        });
      } catch (error) {
        console.error('Error getting categories:', error);
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to get categories'
        });
      }
    });
  }

  getRouter() {
    return this.router;
  }
}

module.exports = { MetaMarketplaceController }; 