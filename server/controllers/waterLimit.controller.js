const { WaterLimitService } = require("../services/waterLimitService");

class WaterLimitController {
  constructor(DI) {
    this.DI = DI;
    this.waterLimitService = new WaterLimitService(DI);
  }

  // Get user's water limit summary
  async getUserWaterLimitSummary(req, res) {
    try {
      const userId = req.user.id;
      const summary = await this.waterLimitService.getUserWaterLimitSummary(userId);

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('Error getting water limit summary:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get water limit summary'
      });
    }
  }

  // Get water limit details for a specific limit
  async getWaterLimitDetails(req, res) {
    try {
      const { waterLimitId } = req.params;
      const userId = req.user.id;

      const waterLimit = await this.DI.waterLimitRepository.findOne({
        id: waterLimitId,
        userId
      });

      if (!waterLimit) {
        return res.status(404).json({
          success: false,
          error: 'Water limit not found'
        });
      }

      // Check if it can be released
      const releaseCheck = await this.waterLimitService.checkWaterLimitRelease(waterLimitId);

      res.json({
        success: true,
        data: {
          waterLimit,
          releaseCheck
        }
      });
    } catch (error) {
      console.error('Error getting water limit details:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get water limit details'
      });
    }
  }

  // Manually release a water limit (if eligible)
  async releaseWaterLimit(req, res) {
    try {
      const { waterLimitId } = req.params;
      const userId = req.user.id;

      // Verify ownership
      const waterLimit = await this.DI.waterLimitRepository.findOne({
        id: waterLimitId,
        userId
      });

      if (!waterLimit) {
        return res.status(404).json({
          success: false,
          error: 'Water limit not found'
        });
      }

      // Check if it can be released
      const releaseCheck = await this.waterLimitService.checkWaterLimitRelease(waterLimitId);
      
      if (!releaseCheck.canRelease) {
        return res.status(400).json({
          success: false,
          error: `Cannot release water limit: ${releaseCheck.reason}`,
          details: releaseCheck
        });
      }

      // Release the water limit
      const releaseResult = await this.waterLimitService.releaseWaterLimit(waterLimitId);

      res.json({
        success: true,
        data: releaseResult,
        message: `Successfully released $${releaseResult.releaseAmount} from water limit`
      });
    } catch (error) {
      console.error('Error releasing water limit:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to release water limit'
      });
    }
  }

  // Get water limit analytics (admin only)
  async getWaterLimitAnalytics(req, res) {
    try {
      // Check if user is admin
      if (!req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Admin access required'
        });
      }

      const analytics = await this.waterLimitService.getWaterLimitAnalytics();

      res.json({
        success: true,
        data: analytics
      });
    } catch (error) {
      console.error('Error getting water limit analytics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get water limit analytics'
      });
    }
  }

  // Process all eligible water limit releases (admin only)
  async processWaterLimitReleases(req, res) {
    try {
      // Check if user is admin
      if (!req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Admin access required'
        });
      }

      const results = await this.waterLimitService.processWaterLimitReleases();

      res.json({
        success: true,
        data: results,
        message: `Processed ${results.processed} water limits, released ${results.released} with total amount $${results.totalReleased}`
      });
    } catch (error) {
      console.error('Error processing water limit releases:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to process water limit releases'
      });
    }
  }

  // Cancel a water limit (admin only, for refunds or errors)
  async cancelWaterLimit(req, res) {
    try {
      // Check if user is admin
      if (!req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Admin access required'
        });
      }

      const { waterLimitId } = req.params;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({
          success: false,
          error: 'Cancellation reason is required'
        });
      }

      const cancelledLimit = await this.waterLimitService.cancelWaterLimit(waterLimitId, reason);

      res.json({
        success: true,
        data: cancelledLimit,
        message: 'Water limit cancelled successfully'
      });
    } catch (error) {
      console.error('Error cancelling water limit:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to cancel water limit'
      });
    }
  }

  // Get water limit configuration (admin only)
  async getWaterLimitConfig(req, res) {
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
        data: this.waterLimitService.waterLimitConfig
      });
    } catch (error) {
      console.error('Error getting water limit config:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get water limit configuration'
      });
    }
  }

  // Update water limit configuration (admin only)
  async updateWaterLimitConfig(req, res) {
    try {
      // Check if user is admin
      if (!req.user.isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'Admin access required'
        });
      }

      const { config } = req.body;

      if (!config || typeof config !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'Valid configuration object is required'
        });
      }

      // Validate configuration structure
      const requiredFields = ['threshold', 'holdPeriod', 'maxHoldAmount'];
      const validTypes = ['investment_return', 'hold_stagnation', 'energy_efficiency'];

      for (const type of validTypes) {
        if (config[type]) {
          for (const field of requiredFields) {
            if (typeof config[type][field] === 'undefined') {
              return res.status(400).json({
                success: false,
                error: `Missing required field '${field}' for type '${type}'`
              });
            }
          }
        }
      }

      // Update configuration
      Object.assign(this.waterLimitService.waterLimitConfig, config);

      res.json({
        success: true,
        data: this.waterLimitService.waterLimitConfig,
        message: 'Water limit configuration updated successfully'
      });
    } catch (error) {
      console.error('Error updating water limit config:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update water limit configuration'
      });
    }
  }

  // Get user's pending water limits with release eligibility
  async getPendingWaterLimits(req, res) {
    try {
      const userId = req.user.id;

      const pendingLimits = await this.DI.waterLimitRepository.find({
        userId,
        status: 'pending'
      });

      const limitsWithReleaseInfo = await Promise.all(
        pendingLimits.map(async (limit) => {
          const releaseCheck = await this.waterLimitService.checkWaterLimitRelease(limit.id);
          return {
            ...limit,
            canRelease: releaseCheck.canRelease,
            releaseReason: releaseCheck.reason,
            releaseDetails: releaseCheck
          };
        })
      );

      res.json({
        success: true,
        data: limitsWithReleaseInfo
      });
    } catch (error) {
      console.error('Error getting pending water limits:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get pending water limits'
      });
    }
  }
}

module.exports = { WaterLimitController }; 