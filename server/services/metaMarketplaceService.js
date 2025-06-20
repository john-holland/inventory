"use strict";

const { getCoefficient } = require('../config/ConstantMarketCoefficients');

class MetaMarketplaceService {
  constructor(em) {
    this.em = em;
  }

  /**
   * Create a new meta marketplace item
   */
  async createItem(userId, itemData) {
    try {
      const itemRepo = this.em.getRepository('MetaMarketplaceItem');
      const userRepo = this.em.getRepository('User');
      
      // Validate user exists
      const user = await userRepo.findOne({ id: userId });
      if (!user) {
        throw new Error('User not found');
      }

      // Validate item data
      this.validateItemData(itemData);

      // Create item
      const item = new (await this.em.getEntity('MetaMarketplaceItem'))(
        userId,
        itemData.title,
        itemData.description,
        itemData.price,
        itemData.category,
        'active'
      );

      // Set additional properties
      if (itemData.quantity) item.quantity = itemData.quantity;
      if (itemData.condition) item.condition = itemData.condition;
      if (itemData.location) item.location = itemData.location;
      if (itemData.shippingCost) item.shippingCost = itemData.shippingCost;
      if (itemData.shippingMethod) item.shippingMethod = itemData.shippingMethod;
      if (itemData.images) item.images = itemData.images;
      if (itemData.tags) item.tags = itemData.tags;
      if (itemData.amazonProductId) item.amazonProductId = itemData.amazonProductId;
      if (itemData.dropShippingListId) item.dropShippingListId = itemData.dropShippingListId;

      // Set metadata
      if (itemData.metadata) {
        item.metadata = {
          ...item.metadata,
          ...itemData.metadata,
          auditTrail: [{
            action: 'created',
            timestamp: new Date(),
            userId: userId,
            details: 'Item created'
          }]
        };
      }

      await this.em.persistAndFlush(item);

      // Create audit log
      await this.createAuditLog('item_created', {
        itemId: item.id,
        userId: userId,
        itemData: itemData
      });

      return item;
    } catch (error) {
      console.error('Error creating meta marketplace item:', error);
      throw error;
    }
  }

  /**
   * Validate item data
   */
  validateItemData(itemData) {
    const requiredFields = ['title', 'description', 'price', 'category'];
    
    for (const field of requiredFields) {
      if (!itemData[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate price limits
    const minPrice = getCoefficient('META_MARKETPLACE.LIMITS.MIN_PRICE');
    const maxPrice = getCoefficient('META_MARKETPLACE.LIMITS.MAX_PRICE');
    
    if (itemData.price < minPrice || itemData.price > maxPrice) {
      throw new Error(`Price must be between $${minPrice} and $${maxPrice}`);
    }

    // Validate quantity
    if (itemData.quantity && itemData.quantity < 1) {
      throw new Error('Quantity must be at least 1');
    }

    // Validate images
    const maxImages = getCoefficient('META_MARKETPLACE.LIMITS.MAX_IMAGES_PER_ITEM');
    if (itemData.images && itemData.images.length > maxImages) {
      throw new Error(`Maximum ${maxImages} images allowed per item`);
    }
  }

  /**
   * Update a meta marketplace item
   */
  async updateItem(itemId, userId, updateData) {
    try {
      const itemRepo = this.em.getRepository('MetaMarketplaceItem');
      
      // Find item
      const item = await itemRepo.findOne({ id: itemId });
      if (!item) {
        throw new Error('Item not found');
      }

      // Check ownership
      if (item.userId !== userId) {
        throw new Error('Unauthorized to update this item');
      }

      // Update fields
      const allowedFields = [
        'title', 'description', 'price', 'category', 'quantity',
        'condition', 'location', 'shippingCost', 'shippingMethod',
        'images', 'tags', 'status'
      ];

      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          item[field] = updateData[field];
        }
      }

      // Update metadata
      if (updateData.metadata) {
        item.metadata = {
          ...item.metadata,
          ...updateData.metadata,
          auditTrail: [
            ...item.metadata.auditTrail,
            {
              action: 'updated',
              timestamp: new Date(),
              userId: userId,
              details: 'Item updated'
            }
          ]
        };
      }

      await this.em.persistAndFlush(item);

      // Create audit log
      await this.createAuditLog('item_updated', {
        itemId: itemId,
        userId: userId,
        updateData: updateData
      });

      return item;
    } catch (error) {
      console.error('Error updating meta marketplace item:', error);
      throw error;
    }
  }

  /**
   * Delete a meta marketplace item
   */
  async deleteItem(itemId, userId) {
    try {
      const itemRepo = this.em.getRepository('MetaMarketplaceItem');
      
      // Find item
      const item = await itemRepo.findOne({ id: itemId });
      if (!item) {
        throw new Error('Item not found');
      }

      // Check ownership
      if (item.userId !== userId) {
        throw new Error('Unauthorized to delete this item');
      }

      // Soft delete by setting status to inactive
      item.status = 'inactive';
      item.metadata.auditTrail.push({
        action: 'deleted',
        timestamp: new Date(),
        userId: userId,
        details: 'Item deleted'
      });

      await this.em.persistAndFlush(item);

      // Create audit log
      await this.createAuditLog('item_deleted', {
        itemId: itemId,
        userId: userId
      });

      return item;
    } catch (error) {
      console.error('Error deleting meta marketplace item:', error);
      throw error;
    }
  }

  /**
   * Get items by user
   */
  async getItemsByUser(userId, status = null) {
    try {
      const itemRepo = this.em.getRepository('MetaMarketplaceItem');
      const query = { userId: userId };
      
      if (status) {
        query.status = status;
      }
      
      return await itemRepo.find(query, {
        orderBy: { createdAt: 'DESC' }
      });
    } catch (error) {
      console.error('Error getting items by user:', error);
      throw error;
    }
  }

  /**
   * Search items
   */
  async searchItems(searchParams) {
    try {
      const itemRepo = this.em.getRepository('MetaMarketplaceItem');
      const query = { status: 'active' };
      
      // Add search filters
      if (searchParams.category) {
        query.category = searchParams.category;
      }
      
      if (searchParams.minPrice !== undefined) {
        query.price = { $gte: searchParams.minPrice };
      }
      
      if (searchParams.maxPrice !== undefined) {
        if (query.price) {
          query.price.$lte = searchParams.maxPrice;
        } else {
          query.price = { $lte: searchParams.maxPrice };
        }
      }
      
      if (searchParams.condition) {
        query.condition = searchParams.condition;
      }
      
      if (searchParams.tags && searchParams.tags.length > 0) {
        query.tags = { $in: searchParams.tags };
      }
      
      // Text search
      if (searchParams.searchTerm) {
        query.$or = [
          { title: { $like: `%${searchParams.searchTerm}%` } },
          { description: { $like: `%${searchParams.searchTerm}%` } }
        ];
      }
      
      const options = {
        orderBy: { createdAt: 'DESC' },
        limit: searchParams.limit || 20,
        offset: searchParams.offset || 0
      };
      
      return await itemRepo.find(query, options);
    } catch (error) {
      console.error('Error searching items:', error);
      throw error;
    }
  }

  /**
   * Get items as alternatives for drop shipping lists
   */
  async getAlternativeItems(amazonProductId, category = null, limit = 10) {
    try {
      const itemRepo = this.em.getRepository('MetaMarketplaceItem');
      const query = { 
        status: 'active',
        amazonProductId: amazonProductId
      };
      
      if (category) {
        query.category = category;
      }
      
      return await itemRepo.find(query, {
        orderBy: { price: 'ASC' },
        limit: limit
      });
    } catch (error) {
      console.error('Error getting alternative items:', error);
      throw error;
    }
  }

  /**
   * Get items by category
   */
  async getItemsByCategory(category, limit = 20) {
    try {
      const itemRepo = this.em.getRepository('MetaMarketplaceItem');
      
      return await itemRepo.find({
        status: 'active',
        category: category
      }, {
        orderBy: { createdAt: 'DESC' },
        limit: limit
      });
    } catch (error) {
      console.error('Error getting items by category:', error);
      throw error;
    }
  }

  /**
   * Get item statistics
   */
  async getItemStatistics() {
    try {
      const itemRepo = this.em.getRepository('MetaMarketplaceItem');
      
      const totalItems = await itemRepo.count();
      const activeItems = await itemRepo.count({ status: 'active' });
      const soldItems = await itemRepo.count({ status: 'sold' });
      const reservedItems = await itemRepo.count({ status: 'reserved' });
      
      // Get category distribution
      const items = await itemRepo.find({ status: 'active' });
      const categoryCount = {};
      
      items.forEach(item => {
        categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;
      });
      
      // Calculate average price
      const totalPrice = items.reduce((sum, item) => sum + parseFloat(item.price), 0);
      const averagePrice = items.length > 0 ? totalPrice / items.length : 0;
      
      return {
        totalItems,
        activeItems,
        soldItems,
        reservedItems,
        categoryDistribution: categoryCount,
        averagePrice: Math.round(averagePrice * 100) / 100
      };
    } catch (error) {
      console.error('Error getting item statistics:', error);
      throw error;
    }
  }

  /**
   * Reserve an item
   */
  async reserveItem(itemId, userId) {
    try {
      const itemRepo = this.em.getRepository('MetaMarketplaceItem');
      
      const item = await itemRepo.findOne({ id: itemId });
      if (!item) {
        throw new Error('Item not found');
      }
      
      if (item.status !== 'active') {
        throw new Error('Item is not available for reservation');
      }
      
      if (item.quantity < 1) {
        throw new Error('Item is out of stock');
      }
      
      // Update item
      item.status = 'reserved';
      item.quantity = item.quantity - 1;
      item.metadata.auditTrail.push({
        action: 'reserved',
        timestamp: new Date(),
        userId: userId,
        details: 'Item reserved'
      });
      
      await this.em.persistAndFlush(item);
      
      // Create audit log
      await this.createAuditLog('item_reserved', {
        itemId: itemId,
        userId: userId
      });
      
      return item;
    } catch (error) {
      console.error('Error reserving item:', error);
      throw error;
    }
  }

  /**
   * Mark item as sold
   */
  async markItemSold(itemId, userId) {
    try {
      const itemRepo = this.em.getRepository('MetaMarketplaceItem');
      
      const item = await itemRepo.findOne({ id: itemId });
      if (!item) {
        throw new Error('Item not found');
      }
      
      item.status = 'sold';
      item.metadata.auditTrail.push({
        action: 'sold',
        timestamp: new Date(),
        userId: userId,
        details: 'Item marked as sold'
      });
      
      await this.em.persistAndFlush(item);
      
      // Create audit log
      await this.createAuditLog('item_sold', {
        itemId: itemId,
        userId: userId
      });
      
      return item;
    } catch (error) {
      console.error('Error marking item as sold:', error);
      throw error;
    }
  }

  /**
   * Create audit log entry
   */
  async createAuditLog(action, data) {
    try {
      // This would typically write to an audit log table
      // For now, we'll just log to console
      console.log(`META MARKETPLACE AUDIT LOG [${action}]:`, {
        timestamp: new Date(),
        action,
        data
      });
    } catch (error) {
      console.error('Error creating audit log:', error);
    }
  }
}

module.exports = { MetaMarketplaceService }; 