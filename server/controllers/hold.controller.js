"use strict";

const express = require('express');
const { HoldService } = require('../services/holdService');
const { getRepository } = require('typeorm');
const { Hold, Item, User, InvestmentPool } = require('../entities');
const { getCoefficient } = require('../config/ConstantMarketCoefficients');

class HoldController {
  constructor(em) {
    this.router = express.Router();
    this.holdService = new HoldService(em);
    this.setupRoutes();
  }

  setupRoutes() {
    // Create a new hold
    this.router.post('/holds', async (req, res) => {
      try {
        const { userId, itemId, shippingRouteId, amount, metadata } = req.body;
        
        if (!userId || !itemId || !amount) {
          return res.status(400).json({
            success: false,
            message: 'Missing required fields: userId, itemId, amount'
          });
        }

        const hold = await this.holdService.createHold(
          userId, 
          itemId, 
          shippingRouteId, 
          amount, 
          metadata
        );

        res.status(201).json({
          success: true,
          data: hold,
          message: 'Hold created successfully'
        });
      } catch (error) {
        console.error('Error creating hold:', error);
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to create hold'
        });
      }
    });

    // Release a hold
    this.router.post('/holds/:holdId/release', async (req, res) => {
      try {
        const { holdId } = req.params;
        const { userId, releaseReason, metadata } = req.body;
        
        if (!userId) {
          return res.status(400).json({
            success: false,
            message: 'Missing required field: userId'
          });
        }

        const result = await this.holdService.releaseHold(
          holdId, 
          userId, 
          releaseReason, 
          metadata
        );

        res.json({
          success: true,
          data: result,
          message: 'Hold released successfully'
        });
      } catch (error) {
        console.error('Error releasing hold:', error);
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to release hold'
        });
      }
    });

    // Get holds by user
    this.router.get('/users/:userId/holds', async (req, res) => {
      try {
        const { userId } = req.params;
        const { status } = req.query;

        const holds = await this.holdService.getHoldsByUser(userId, status);

        res.json({
          success: true,
          data: holds,
          count: holds.length
        });
      } catch (error) {
        console.error('Error getting holds by user:', error);
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to get holds'
        });
      }
    });

    // Get holds by item
    this.router.get('/items/:itemId/holds', async (req, res) => {
      try {
        const { itemId } = req.params;
        const { status } = req.query;

        const holds = await this.holdService.getHoldsByItem(itemId, status);

        res.json({
          success: true,
          data: holds,
          count: holds.length
        });
      } catch (error) {
        console.error('Error getting holds by item:', error);
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to get holds'
        });
      }
    });

    // Get hold statistics
    this.router.get('/holds/statistics', async (req, res) => {
      try {
        const stats = await this.holdService.getHoldStatistics();

        res.json({
          success: true,
          data: stats
        });
      } catch (error) {
        console.error('Error getting hold statistics:', error);
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to get hold statistics'
        });
      }
    });

    // Process expired holds (admin endpoint)
    this.router.post('/holds/process-expired', async (req, res) => {
      try {
        const result = await this.holdService.processExpiredHolds();

        res.json({
          success: true,
          data: result
        });
      } catch (error) {
        console.error('Error processing expired holds:', error);
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to process expired holds'
        });
      }
    });

    // Expire a hold (admin endpoint)
    this.router.post('/holds/:holdId/expire', async (req, res) => {
      try {
        const { holdId } = req.params;
        const { reason } = req.body;

        const hold = await this.holdService.expireHold(holdId, reason);

        res.json({
          success: true,
          data: hold,
          message: 'Hold expired successfully'
        });
      } catch (error) {
        console.error('Error expiring hold:', error);
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to expire hold'
        });
      }
    });

    // Get hold by ID
    this.router.get('/holds/:holdId', async (req, res) => {
      try {
        const { holdId } = req.params;
        const holdRepo = this.holdService.em.getRepository('Hold');
        
        const hold = await holdRepo.findOne({ id: holdId }, {
          populate: ['userId', 'itemId', 'shippingRouteId', 'consumerInvestmentId']
        });

        if (!hold) {
          return res.status(404).json({
            success: false,
            message: 'Hold not found'
          });
        }

        res.json({
          success: true,
          data: hold
        });
      } catch (error) {
        console.error('Error getting hold:', error);
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to get hold'
        });
      }
    });

    // Create a hold on an item
    this.router.post('/holds/item', async (req, res) => {
      try {
        const { itemId, amount, duration, message } = req.body;
        const holdRepo = getRepository(Hold);
        const itemRepo = getRepository(Item);
        const userRepo = getRepository(User);

        // Validate required fields
        if (!itemId || !amount) {
          return res.status(400).json({
            success: false,
            message: 'Item ID and hold amount are required'
          });
        }

        // Check if item exists and is available
        const item = await itemRepo.findOne({
          where: { id: parseInt(itemId), isActive: true },
          relations: ['owner']
        });

        if (!item) {
          return res.status(404).json({
            success: false,
            message: 'Item not found or not available'
          });
        }

        // Check if user is not the owner
        if (item.owner.id === req.user.id) {
          return res.status(400).json({
            success: false,
            message: 'Cannot hold your own item'
          });
        }

        // Check if user has sufficient balance
        const user = await userRepo.findOne({ where: { id: req.user.id } });
        if (user.balance < parseFloat(amount)) {
          return res.status(400).json({
            success: false,
            message: 'Insufficient balance for this hold'
          });
        }

        // Check if there's already an active hold from this user
        const existingHold = await holdRepo.findOne({
          where: {
            item: { id: parseInt(itemId) },
            user: { id: req.user.id },
            status: 'active'
          }
        });

        if (existingHold) {
          return res.status(400).json({
            success: false,
            message: 'You already have an active hold on this item'
          });
        }

        // Calculate hold duration
        const holdDuration = duration || getCoefficient('HOLD_DURATION_DAYS', 7);
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + holdDuration);

        // Create the hold
        const hold = holdRepo.create({
          item,
          user,
          owner: item.owner,
          amount: parseFloat(amount),
          duration: holdDuration,
          message: message || '',
          status: 'active',
          expiresAt,
          createdAt: new Date()
        });

        // Deduct amount from user balance
        user.balance -= parseFloat(amount);
        await userRepo.save(user);

        const savedHold = await holdRepo.save(hold);

        res.status(201).json({
          success: true,
          data: savedHold,
          message: 'Hold created successfully'
        });
      } catch (error) {
        console.error('Error creating hold:', error);
        res.status(500).json({
          success: false,
          message: 'Error creating hold'
        });
      }
    });

    // Get holds for a user
    this.router.get('/users/:userId/holds', async (req, res) => {
      try {
        const { userId } = req.params;
        const { page = 1, limit = 20, status } = req.query;
        const holdRepo = getRepository(Hold);

        let whereClause = { user: { id: parseInt(userId) } };
        if (status) {
          whereClause.status = status;
        }

        const [holds, total] = await holdRepo.findAndCount({
          where: whereClause,
          relations: ['item', 'item.images', 'owner'],
          order: { createdAt: 'DESC' },
          skip: (page - 1) * limit,
          take: limit
        });

        res.json({
          success: true,
          data: holds,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        });
      } catch (error) {
        console.error('Error getting user holds:', error);
        res.status(500).json({
          success: false,
          message: 'Error retrieving holds'
        });
      }
    });

    // Get holds on items owned by user
    this.router.get('/items/:itemId/holds', async (req, res) => {
      try {
        const { itemId } = req.params;
        const { page = 1, limit = 20, status } = req.query;
        const holdRepo = getRepository(Hold);

        let whereClause = { owner: { id: parseInt(itemId) } };
        if (status) {
          whereClause.status = status;
        }

        const [holds, total] = await holdRepo.findAndCount({
          where: whereClause,
          relations: ['item', 'item.images', 'user'],
          order: { createdAt: 'DESC' },
          skip: (page - 1) * limit,
          take: limit
        });

        res.json({
          success: true,
          data: holds,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
          }
        });
      } catch (error) {
        console.error('Error getting item holds:', error);
        res.status(500).json({
          success: false,
          message: 'Error retrieving item holds'
        });
      }
    });

    // Extend a hold
    this.router.post('/holds/:holdId/extend', async (req, res) => {
      try {
        const { holdId } = req.params;
        const { additionalDays } = req.body;
        const holdRepo = getRepository(Hold);

        if (!additionalDays || additionalDays <= 0) {
          return res.status(400).json({
            success: false,
            message: 'Valid additional days are required'
          });
        }

        const hold = await holdRepo.findOne({
          where: { id: parseInt(holdId) },
          relations: ['user']
        });

        if (!hold) {
          return res.status(404).json({
            success: false,
            message: 'Hold not found'
          });
        }

        // Check if user owns the hold
        if (hold.user.id !== req.user.id) {
          return res.status(403).json({
            success: false,
            message: 'Not authorized to extend this hold'
          });
        }

        // Check if hold is active
        if (hold.status !== 'active') {
          return res.status(400).json({
            success: false,
            message: 'Hold is not active'
          });
        }

        // Extend the hold
        const newExpiresAt = new Date(hold.expiresAt);
        newExpiresAt.setDate(newExpiresAt.getDate() + parseInt(additionalDays));

        hold.expiresAt = newExpiresAt;
        hold.duration += parseInt(additionalDays);
        hold.extendedAt = new Date();
        await holdRepo.save(hold);

        res.json({
          success: true,
          data: hold,
          message: 'Hold extended successfully'
        });
      } catch (error) {
        console.error('Error extending hold:', error);
        res.status(500).json({
          success: false,
          message: 'Error extending hold'
        });
      }
    });

    // Get hold statistics
    this.router.get('/holds/stats', async (req, res) => {
      try {
        const holdRepo = getRepository(Hold);

        const stats = await holdRepo
          .createQueryBuilder('hold')
          .select([
            'COUNT(*) as totalHolds',
            'COUNT(CASE WHEN hold.status = \'active\' THEN 1 END) as activeHolds',
            'COUNT(CASE WHEN hold.status = \'expired\' THEN 1 END) as expiredHolds',
            'COUNT(CASE WHEN hold.status = \'released\' THEN 1 END) as releasedHolds',
            'COUNT(CASE WHEN hold.status = \'converted_to_purchase\' THEN 1 END) as convertedHolds',
            'SUM(hold.amount) as totalHoldAmount',
            'AVG(hold.amount) as averageHoldAmount',
            'AVG(hold.duration) as averageHoldDuration'
          ])
          .where('hold.user.id = :userId OR hold.owner.id = :ownerId', {
            userId: req.user.id,
            ownerId: req.user.id
          })
          .getRawOne();

        res.json({
          success: true,
          data: stats
        });
      } catch (error) {
        console.error('Error getting hold stats:', error);
        res.status(500).json({
          success: false,
          message: 'Error retrieving hold statistics'
        });
      }
    });
  }

  getRouter() {
    return this.router;
  }
}

module.exports = { HoldController }; 