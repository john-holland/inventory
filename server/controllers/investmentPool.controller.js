"use strict";

const express = require('express');
const { InvestmentPoolService } = require('../services/investmentPoolService');

class InvestmentPoolController {
  constructor(em) {
    this.router = express.Router();
    this.investmentPoolService = new InvestmentPoolService(em);
    this.setupRoutes();
  }

  setupRoutes() {
    // Create a new investment pool
    this.router.post('/pools', async (req, res) => {
      try {
        const { userId, poolType, initialAmount, settings } = req.body;
        
        if (!userId || !poolType) {
          return res.status(400).json({
            success: false,
            message: 'Missing required fields: userId, poolType'
          });
        }

        const pool = await this.investmentPoolService.createPool(
          userId, 
          poolType, 
          initialAmount || 0, 
          settings || {}
        );

        res.status(201).json({
          success: true,
          data: pool,
          message: 'Investment pool created successfully'
        });
      } catch (error) {
        console.error('Error creating investment pool:', error);
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to create investment pool'
        });
      }
    });

    // Add funds to a pool
    this.router.post('/pools/:poolId/funds', async (req, res) => {
      try {
        const { poolId } = req.params;
        const { amount, source } = req.body;
        
        if (!amount || amount <= 0) {
          return res.status(400).json({
            success: false,
            message: 'Amount must be greater than 0'
          });
        }

        const pool = await this.investmentPoolService.addFunds(
          poolId, 
          amount, 
          source || 'wallet'
        );

        res.json({
          success: true,
          data: pool,
          message: 'Funds added successfully'
        });
      } catch (error) {
        console.error('Error adding funds to pool:', error);
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to add funds'
        });
      }
    });

    // Calculate returns for a pool
    this.router.get('/pools/:poolId/returns', async (req, res) => {
      try {
        const { poolId } = req.params;

        const returns = await this.investmentPoolService.calculateReturns(poolId);

        res.json({
          success: true,
          data: returns
        });
      } catch (error) {
        console.error('Error calculating returns:', error);
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to calculate returns'
        });
      }
    });

    // Distribute returns to a pool
    this.router.post('/pools/:poolId/returns', async (req, res) => {
      try {
        const { poolId } = req.params;
        const { returnAmount } = req.body;
        
        if (!returnAmount || returnAmount <= 0) {
          return res.status(400).json({
            success: false,
            message: 'Return amount must be greater than 0'
          });
        }

        const pool = await this.investmentPoolService.distributeReturns(poolId, returnAmount);

        res.json({
          success: true,
          data: pool,
          message: 'Returns distributed successfully'
        });
      } catch (error) {
        console.error('Error distributing returns:', error);
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to distribute returns'
        });
      }
    });

    // Get pools by user
    this.router.get('/users/:userId/pools', async (req, res) => {
      try {
        const { userId } = req.params;
        const { poolType } = req.query;

        const pools = await this.investmentPoolService.getPoolsByUser(userId, poolType);

        res.json({
          success: true,
          data: pools,
          count: pools.length
        });
      } catch (error) {
        console.error('Error getting pools by user:', error);
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to get pools'
        });
      }
    });

    // Get herd performance
    this.router.get('/herd/performance', async (req, res) => {
      try {
        const performance = await this.investmentPoolService.getHerdPerformance();

        res.json({
          success: true,
          data: performance
        });
      } catch (error) {
        console.error('Error getting herd performance:', error);
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to get herd performance'
        });
      }
    });

    // Process automatic rebalancing (admin endpoint)
    this.router.post('/automatic/rebalance', async (req, res) => {
      try {
        const result = await this.investmentPoolService.processAutomaticRebalancing();

        res.json({
          success: true,
          data: result,
          message: `Processed ${result.processed} of ${result.total} automatic pools`
        });
      } catch (error) {
        console.error('Error processing automatic rebalancing:', error);
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to process automatic rebalancing'
        });
      }
    });

    // Get pool statistics
    this.router.get('/statistics', async (req, res) => {
      try {
        const stats = await this.investmentPoolService.getPoolStatistics();

        res.json({
          success: true,
          data: stats
        });
      } catch (error) {
        console.error('Error getting pool statistics:', error);
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to get pool statistics'
        });
      }
    });

    // Get pool by ID
    this.router.get('/pools/:poolId', async (req, res) => {
      try {
        const { poolId } = req.params;
        const poolRepo = this.investmentPoolService.em.getRepository('InvestmentPool');
        
        const pool = await poolRepo.findOne({ id: poolId }, {
          populate: ['userId']
        });

        if (!pool) {
          return res.status(404).json({
            success: false,
            message: 'Pool not found'
          });
        }

        res.json({
          success: true,
          data: pool
        });
      } catch (error) {
        console.error('Error getting pool:', error);
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to get pool'
        });
      }
    });

    // Update pool settings
    this.router.put('/pools/:poolId', async (req, res) => {
      try {
        const { poolId } = req.params;
        const { userId, settings } = req.body;
        
        if (!userId) {
          return res.status(400).json({
            success: false,
            message: 'Missing required field: userId'
          });
        }

        const pool = await this.investmentPoolService.updatePool(poolId, userId, settings);

        res.json({
          success: true,
          data: pool,
          message: 'Pool updated successfully'
        });
      } catch (error) {
        console.error('Error updating pool:', error);
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to update pool'
        });
      }
    });

    // Deactivate a pool
    this.router.post('/pools/:poolId/deactivate', async (req, res) => {
      try {
        const { poolId } = req.params;
        const { userId } = req.body;
        
        if (!userId) {
          return res.status(400).json({
            success: false,
            message: 'Missing required field: userId'
          });
        }

        const pool = await this.investmentPoolService.deactivatePool(poolId, userId);

        res.json({
          success: true,
          data: pool,
          message: 'Pool deactivated successfully'
        });
      } catch (error) {
        console.error('Error deactivating pool:', error);
        res.status(500).json({
          success: false,
          message: error.message || 'Failed to deactivate pool'
        });
      }
    });
  }

  getRouter() {
    return this.router;
  }
}

module.exports = { InvestmentPoolController }; 