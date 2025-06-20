const { ConsumerInvestmentService } = require("../services/consumerInvestmentService");

class ConsumerInvestmentController {
  constructor(DI) {
    this.DI = DI;
    this.consumerInvestmentService = new ConsumerInvestmentService(DI);
  }

  // Get user's consumer investment portfolio
  async getUserPortfolio(req, res) {
    try {
      const userId = req.user.id;
      const portfolio = await this.consumerInvestmentService.getUserConsumerInvestmentPortfolio(userId);

      res.json({
        success: true,
        data: portfolio
      });
    } catch (error) {
      console.error('Error getting consumer investment portfolio:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get consumer investment portfolio'
      });
    }
  }

  // Get platform investment analytics (admin only)
  async getPlatformAnalytics(req, res) {
    try {
      // Check if user is admin
      if (!req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Admin access required'
        });
      }

      const analytics = await this.consumerInvestmentService.getPlatformInvestmentAnalytics();

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      console.error('Error getting platform investment analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get platform investment analytics'
      });
    }
  }

  // Calculate consumer investment returns (admin only)
  async calculateReturns(req, res) {
    try {
      // Check if user is admin
      if (!req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Admin access required'
        });
      }

      const results = await this.consumerInvestmentService.calculateConsumerInvestmentReturns();

      res.json({
        success: true,
        data: results,
        message: `Calculated returns for ${results.processed} investments. Total consumer returns: $${results.totalConsumerReturns.toFixed(2)}, Total platform returns: $${results.totalPlatformReturns.toFixed(2)}`
      });
    } catch (error) {
      console.error('Error calculating consumer investment returns:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to calculate consumer investment returns'
      });
    }
  }

  // Distribute platform returns to all consumers (admin only)
  async distributePlatformReturns(req, res) {
    try {
      // Check if user is admin
      if (!req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Admin access required'
        });
      }

      const results = await this.consumerInvestmentService.distributePlatformReturns();

      res.json({
        success: true,
        data: results,
        message: `Distributed $${results.amount.toFixed(2)} to ${results.distributed} consumers. Share per consumer: $${results.sharePerConsumer.toFixed(2)}`
      });
    } catch (error) {
      console.error('Error distributing platform returns:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to distribute platform returns'
      });
    }
  }

  // Get consumer investment details
  async getInvestmentDetails(req, res) {
    try {
      const { investmentId } = req.params;
      const userId = req.user.id;

      const investment = await this.DI.consumerInvestmentRepository.findOne({
        id: investmentId,
        userId
      });

      if (!investment) {
        return res.status(404).json({
          success: false,
          error: 'Consumer investment not found'
        });
      }

      // Get item details
      const item = await this.DI.itemRepository.findOne({ id: investment.itemId });

      res.json({
        success: true,
        data: {
          investment,
          item: item ? {
            id: item.id,
            title: item.title,
            category: item.category,
            value: item.value,
            status: item.status
          } : null
        }
      });
    } catch (error) {
      console.error('Error getting investment details:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get investment details'
      });
    }
  }

  // Get revenue split configuration (admin only)
  async getRevenueSplitConfig(req, res) {
    try {
      // Check if user is admin
      if (!req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Admin access required'
        });
      }

      res.json({
        success: true,
        data: this.consumerInvestmentService.revenueSplit
      });
    } catch (error) {
      console.error('Error getting revenue split config:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get revenue split configuration'
      });
    }
  }

  // Update revenue split configuration (admin only)
  async updateRevenueSplitConfig(req, res) {
    try {
      // Check if user is admin
      if (!req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Admin access required'
        });
      }

      const { consumerShare, platformShare, distributionStrategy } = req.body;

      // Validate configuration
      if (typeof consumerShare !== 'number' || typeof platformShare !== 'number') {
        return res.status(400).json({
          success: false,
          error: 'Consumer share and platform share must be numbers'
        });
      }

      if (consumerShare + platformShare !== 1) {
        return res.status(400).json({
          success: false,
          error: 'Consumer share and platform share must sum to 1 (100%)'
        });
      }

      if (consumerShare < 0 || platformShare < 0) {
        return res.status(400).json({
          success: false,
          error: 'Shares cannot be negative'
        });
      }

      // Update configuration
      this.consumerInvestmentService.revenueSplit = {
        consumerShare,
        platformShare,
        distributionStrategy: distributionStrategy || 'equal_share'
      };

      res.json({
        success: true,
        data: this.consumerInvestmentService.revenueSplit,
        message: 'Revenue split configuration updated successfully'
      });
    } catch (error) {
      console.error('Error updating revenue split config:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update revenue split configuration'
      });
    }
  }

  // Get consumer investment performance summary
  async getPerformanceSummary(req, res) {
    try {
      const userId = req.user.id;
      const portfolio = await this.consumerInvestmentService.getUserConsumerInvestmentPortfolio(userId);

      const summary = {
        totalInvested: portfolio.totalInvested,
        totalReturns: portfolio.totalReturns,
        totalValue: portfolio.totalValue,
        activeInvestments: portfolio.summary.activeCount,
        completedInvestments: portfolio.summary.completedCount,
        averageReturnRate: portfolio.summary.averageReturnRate,
        totalReturnPercentage: portfolio.totalInvested > 0 ? 
          (portfolio.totalReturns / portfolio.totalInvested) * 100 : 0
      };

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('Error getting performance summary:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get performance summary'
      });
    }
  }

  // Get consumer investment history
  async getInvestmentHistory(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 50, offset = 0 } = req.query;

      const investments = await this.DI.consumerInvestmentRepository.find({
        userId
      }, {
        orderBy: { createdAt: 'DESC' },
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      const history = investments.map(investment => ({
        id: investment.id,
        itemId: investment.itemId,
        holdAmount: investment.holdAmount,
        consumerInvestment: investment.consumerInvestmentAmount,
        platformInvestment: investment.platformInvestmentAmount,
        currentValue: investment.currentValue,
        returnRate: investment.returnRate,
        consumerReturn: investment.consumerReturnAmount,
        platformReturn: investment.platformReturnAmount,
        sharedReturn: investment.sharedReturnAmount,
        status: investment.status,
        createdAt: investment.createdAt,
        lastUpdated: investment.lastUpdated,
        metadata: investment.metadata
      }));

      res.json({
        success: true,
        data: {
          history,
          pagination: {
            limit: parseInt(limit),
            offset: parseInt(offset),
            total: history.length
          }
        }
      });
    } catch (error) {
      console.error('Error getting investment history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get investment history'
      });
    }
  }
}

module.exports = { ConsumerInvestmentController }; 