const express = require('express');
const { SquareService } = require('../services/squareService');

class SquareController {
  constructor(DI) {
    this.DI = DI;
    this.squareService = new SquareService(DI);
    this.router = express.Router();
    this.setupRoutes();
  }

  setupRoutes() {
    // Square account management
    this.router.post('/accounts', this.createSquareAccount.bind(this));
    this.router.get('/accounts', this.getSquareAccounts.bind(this));
    this.router.get('/accounts/:id', this.getSquareAccount.bind(this));
    this.router.put('/accounts/:id', this.updateSquareAccount.bind(this));
    this.router.delete('/accounts/:id', this.deleteSquareAccount.bind(this));

    // Square API integration
    this.router.get('/accounts/:id/locations', this.getSquareLocations.bind(this));
    this.router.post('/accounts/:id/sync', this.syncSquareData.bind(this));
    this.router.post('/accounts/:id/refresh-token', this.refreshAccessToken.bind(this));

    // Bill management
    this.router.get('/accounts/:id/bills', this.getSquareBills.bind(this));
    this.router.post('/accounts/:id/bills/sync', this.syncBills.bind(this));
    this.router.get('/accounts/:id/bills/:billId', this.getSquareBill.bind(this));
    this.router.put('/accounts/:id/bills/:billId', this.updateSquareBill.bind(this));

    // Water level management
    this.router.post('/accounts/:id/water-level/calculate', this.calculateWaterLevelAdjustments.bind(this));
    this.router.post('/water-level/process', this.processWaterLevelAdjustments.bind(this));
    this.router.get('/accounts/:id/water-level/adjustments', this.getWaterLevelAdjustments.bind(this));

    // Analytics
    this.router.get('/accounts/:id/analytics', this.getSquareAnalytics.bind(this));
    this.router.get('/accounts/:id/analytics/monthly', this.getMonthlyAnalytics.bind(this));
    this.router.get('/accounts/:id/analytics/categories', this.getCategoryAnalytics.bind(this));
  }

  // Create Square account
  async createSquareAccount(req, res) {
    try {
      const { userId, squareLocationId, squareAccessToken, refreshToken, status = 'active' } = req.body;

      if (!userId || !squareLocationId || !squareAccessToken || !refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Missing required fields: userId, squareLocationId, squareAccessToken, refreshToken'
        });
      }

      const squareAccount = new this.DI.squareAccountRepository.entity(
        userId,
        squareLocationId,
        squareAccessToken,
        refreshToken,
        status
      );

      await this.DI.squareAccountRepository.persistAndFlush(squareAccount);

      res.status(201).json({
        success: true,
        message: 'Square account created successfully',
        data: {
          id: squareAccount.id,
          userId: squareAccount.userId,
          squareLocationId: squareAccount.squareLocationId,
          status: squareAccount.status,
          createdAt: squareAccount.createdAt
        }
      });
    } catch (error) {
      console.error('Error creating Square account:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create Square account',
        error: error.message
      });
    }
  }

  // Get all Square accounts
  async getSquareAccounts(req, res) {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const offset = (page - 1) * limit;

      const where = {};
      if (status) {
        where.status = status;
      }

      const [accounts, total] = await this.DI.squareAccountRepository.findAndCount(where, {
        limit: parseInt(limit),
        offset: parseInt(offset),
        orderBy: { createdAt: 'DESC' }
      });

      res.json({
        success: true,
        data: accounts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error getting Square accounts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get Square accounts',
        error: error.message
      });
    }
  }

  // Get Square account by ID
  async getSquareAccount(req, res) {
    try {
      const { id } = req.params;

      const squareAccount = await this.DI.squareAccountRepository.findOne({ id: parseInt(id) });

      if (!squareAccount) {
        return res.status(404).json({
          success: false,
          message: 'Square account not found'
        });
      }

      res.json({
        success: true,
        data: squareAccount
      });
    } catch (error) {
      console.error('Error getting Square account:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get Square account',
        error: error.message
      });
    }
  }

  // Update Square account
  async updateSquareAccount(req, res) {
    try {
      const { id } = req.params;
      const { status, preferences } = req.body;

      const squareAccount = await this.DI.squareAccountRepository.findOne({ id: parseInt(id) });

      if (!squareAccount) {
        return res.status(404).json({
          success: false,
          message: 'Square account not found'
        });
      }

      const { wrap } = require("@mikro-orm/core");
      const updates = {};

      if (status) updates.status = status;
      if (preferences) updates.preferences = { ...squareAccount.preferences, ...preferences };

      wrap(squareAccount).assign(updates);
      await this.DI.squareAccountRepository.flush();

      res.json({
        success: true,
        message: 'Square account updated successfully',
        data: squareAccount
      });
    } catch (error) {
      console.error('Error updating Square account:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update Square account',
        error: error.message
      });
    }
  }

  // Delete Square account
  async deleteSquareAccount(req, res) {
    try {
      const { id } = req.params;

      const squareAccount = await this.DI.squareAccountRepository.findOne({ id: parseInt(id) });

      if (!squareAccount) {
        return res.status(404).json({
          success: false,
          message: 'Square account not found'
        });
      }

      await this.DI.squareAccountRepository.removeAndFlush(squareAccount);

      res.json({
        success: true,
        message: 'Square account deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting Square account:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete Square account',
        error: error.message
      });
    }
  }

  // Get Square locations
  async getSquareLocations(req, res) {
    try {
      const { id } = req.params;

      const squareAccount = await this.DI.squareAccountRepository.findOne({ id: parseInt(id) });

      if (!squareAccount) {
        return res.status(404).json({
          success: false,
          message: 'Square account not found'
        });
      }

      const locations = await this.squareService.getLocations();

      res.json({
        success: true,
        data: locations
      });
    } catch (error) {
      console.error('Error getting Square locations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get Square locations',
        error: error.message
      });
    }
  }

  // Sync Square data
  async syncSquareData(req, res) {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.body;

      const squareAccount = await this.DI.squareAccountRepository.findOne({ id: parseInt(id) });

      if (!squareAccount) {
        return res.status(404).json({
          success: false,
          message: 'Square account not found'
        });
      }

      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      const result = await this.squareService.syncBills(parseInt(id), start, end);

      res.json({
        success: true,
        message: 'Square data synced successfully',
        data: result
      });
    } catch (error) {
      console.error('Error syncing Square data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to sync Square data',
        error: error.message
      });
    }
  }

  // Refresh access token
  async refreshAccessToken(req, res) {
    try {
      const { id } = req.params;

      const result = await this.squareService.refreshAccessToken(parseInt(id));

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      console.error('Error refreshing access token:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to refresh access token',
        error: error.message
      });
    }
  }

  // Get Square bills
  async getSquareBills(req, res) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10, category, status, startDate, endDate } = req.query;
      const offset = (page - 1) * limit;

      const where = { squareAccountId: parseInt(id) };

      if (category) where.category = category;
      if (status) where.status = status;
      if (startDate || endDate) {
        where.billDate = {};
        if (startDate) where.billDate.$gte = new Date(startDate);
        if (endDate) where.billDate.$lte = new Date(endDate);
      }

      const [bills, total] = await this.DI.squareBillRepository.findAndCount(where, {
        limit: parseInt(limit),
        offset: parseInt(offset),
        orderBy: { billDate: 'DESC' }
      });

      res.json({
        success: true,
        data: bills,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error getting Square bills:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get Square bills',
        error: error.message
      });
    }
  }

  // Sync bills
  async syncBills(req, res) {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.body;

      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;

      const result = await this.squareService.syncBills(parseInt(id), start, end);

      res.json({
        success: true,
        message: 'Bills synced successfully',
        data: result
      });
    } catch (error) {
      console.error('Error syncing bills:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to sync bills',
        error: error.message
      });
    }
  }

  // Get Square bill by ID
  async getSquareBill(req, res) {
    try {
      const { id, billId } = req.params;

      const bill = await this.DI.squareBillRepository.findOne({
        id: parseInt(billId),
        squareAccountId: parseInt(id)
      });

      if (!bill) {
        return res.status(404).json({
          success: false,
          message: 'Square bill not found'
        });
      }

      res.json({
        success: true,
        data: bill
      });
    } catch (error) {
      console.error('Error getting Square bill:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get Square bill',
        error: error.message
      });
    }
  }

  // Update Square bill
  async updateSquareBill(req, res) {
    try {
      const { id, billId } = req.params;
      const { category, description, tags, notes } = req.body;

      const bill = await this.DI.squareBillRepository.findOne({
        id: parseInt(billId),
        squareAccountId: parseInt(id)
      });

      if (!bill) {
        return res.status(404).json({
          success: false,
          message: 'Square bill not found'
        });
      }

      const { wrap } = require("@mikro-orm/core");
      const updates = {};

      if (category) updates.category = category;
      if (description) updates.description = description;
      if (tags) updates.tags = tags;
      if (notes) {
        bill.metadata.notes = notes;
      }

      wrap(bill).assign(updates);
      await this.DI.squareBillRepository.flush();

      res.json({
        success: true,
        message: 'Square bill updated successfully',
        data: bill
      });
    } catch (error) {
      console.error('Error updating Square bill:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update Square bill',
        error: error.message
      });
    }
  }

  // Calculate water level adjustments
  async calculateWaterLevelAdjustments(req, res) {
    try {
      const { id } = req.params;
      const { month } = req.body;

      const monthDate = month ? new Date(month) : null;

      const result = await this.squareService.calculateWaterLevelAdjustments(parseInt(id), monthDate);

      res.json({
        success: true,
        message: 'Water level adjustments calculated successfully',
        data: result
      });
    } catch (error) {
      console.error('Error calculating water level adjustments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to calculate water level adjustments',
        error: error.message
      });
    }
  }

  // Process water level adjustments
  async processWaterLevelAdjustments(req, res) {
    try {
      const result = await this.squareService.processWaterLevelAdjustments();

      res.json({
        success: true,
        message: 'Water level adjustments processed successfully',
        data: result
      });
    } catch (error) {
      console.error('Error processing water level adjustments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process water level adjustments',
        error: error.message
      });
    }
  }

  // Get water level adjustments
  async getWaterLevelAdjustments(req, res) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10, processed } = req.query;
      const offset = (page - 1) * limit;

      const where = { waterLimitId: { $in: [] } };

      // Get water limits for this account
      const waterLimits = await this.DI.waterLimitRepository.find({});
      const waterLimitIds = waterLimits.map(wl => wl.id);
      where.waterLimitId = { $in: waterLimitIds };

      if (processed !== undefined) {
        where.processed = processed === 'true';
      }

      const [adjustments, total] = await this.DI.waterLevelBillRepository.findAndCount(where, {
        limit: parseInt(limit),
        offset: parseInt(offset),
        orderBy: { effectiveDate: 'DESC' }
      });

      res.json({
        success: true,
        data: adjustments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error getting water level adjustments:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get water level adjustments',
        error: error.message
      });
    }
  }

  // Get Square analytics
  async getSquareAnalytics(req, res) {
    try {
      const { id } = req.params;

      const result = await this.squareService.getSquareAnalytics(parseInt(id));

      res.json({
        success: true,
        data: result.analytics
      });
    } catch (error) {
      console.error('Error getting Square analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get Square analytics',
        error: error.message
      });
    }
  }

  // Get monthly analytics
  async getMonthlyAnalytics(req, res) {
    try {
      const { id } = req.params;
      const { months = 6 } = req.query;

      const squareAccount = await this.DI.squareAccountRepository.findOne({ id: parseInt(id) });

      if (!squareAccount) {
        return res.status(404).json({
          success: false,
          message: 'Square account not found'
        });
      }

      const bills = await this.DI.squareBillRepository.find({
        squareAccountId: parseInt(id)
      }, {
        orderBy: { billDate: 'DESC' }
      });

      const monthlyData = {};
      const currentDate = new Date();

      for (let i = 0; i < parseInt(months); i++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        const monthBills = bills.filter(bill => {
          const billDate = new Date(bill.billDate);
          return billDate.getFullYear() === date.getFullYear() && 
                 billDate.getMonth() === date.getMonth();
        });

        monthlyData[monthKey] = {
          total: monthBills.reduce((sum, bill) => sum + bill.amount, 0),
          count: monthBills.length,
          categories: {
            server: monthBills.filter(bill => bill.category === 'server').reduce((sum, bill) => sum + bill.amount, 0),
            it: monthBills.filter(bill => bill.category === 'it').reduce((sum, bill) => sum + bill.amount, 0),
            hr: monthBills.filter(bill => bill.category === 'hr').reduce((sum, bill) => sum + bill.amount, 0),
            other: monthBills.filter(bill => bill.category === 'other').reduce((sum, bill) => sum + bill.amount, 0)
          }
        };
      }

      res.json({
        success: true,
        data: monthlyData
      });
    } catch (error) {
      console.error('Error getting monthly analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get monthly analytics',
        error: error.message
      });
    }
  }

  // Get category analytics
  async getCategoryAnalytics(req, res) {
    try {
      const { id } = req.params;
      const { startDate, endDate } = req.query;

      const where = { squareAccountId: parseInt(id) };

      if (startDate || endDate) {
        where.billDate = {};
        if (startDate) where.billDate.$gte = new Date(startDate);
        if (endDate) where.billDate.$lte = new Date(endDate);
      }

      const bills = await this.DI.squareBillRepository.find(where);

      const categories = ['server', 'it', 'hr', 'other'];
      const analytics = {};

      for (const category of categories) {
        const categoryBills = bills.filter(bill => bill.category === category);
        analytics[category] = {
          count: categoryBills.length,
          total: categoryBills.reduce((sum, bill) => sum + bill.amount, 0),
          average: categoryBills.length > 0 ? categoryBills.reduce((sum, bill) => sum + bill.amount, 0) / categoryBills.length : 0,
          percentage: bills.length > 0 ? (categoryBills.length / bills.length) * 100 : 0
        };
      }

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      console.error('Error getting category analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get category analytics',
        error: error.message
      });
    }
  }
}

module.exports = { SquareController }; 