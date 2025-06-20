const express = require('express');
const router = express.Router();

class DisputeController {
  constructor(disputeService, authMiddleware) {
    this.disputeService = disputeService;
    this.authMiddleware = authMiddleware;
    this.setupRoutes();
  }

  setupRoutes() {
    // Create dispute
    router.post('/create/:holdId', 
      this.authMiddleware.requireAuth,
      this.createDispute.bind(this)
    );

    // Update dispute
    router.put('/:disputeId', 
      this.authMiddleware.requireAuth,
      this.updateDispute.bind(this)
    );

    // Resolve dispute (moderators only)
    router.post('/resolve/:disputeId', 
      this.authMiddleware.requireAuth,
      this.authMiddleware.requireModerator,
      this.resolveDispute.bind(this)
    );

    // Get dispute details
    router.get('/:disputeId', 
      this.authMiddleware.requireAuth,
      this.getDispute.bind(this)
    );

    // Get hold disputes
    router.get('/hold/:holdId', 
      this.authMiddleware.requireAuth,
      this.getHoldDisputes.bind(this)
    );

    // Get dispute stats (moderators only)
    router.get('/stats/overview', 
      this.authMiddleware.requireAuth,
      this.authMiddleware.requireModerator,
      this.getDisputeStats.bind(this)
    );

    // Get all disputes (moderators only)
    router.get('/admin/all', 
      this.authMiddleware.requireAuth,
      this.authMiddleware.requireModerator,
      this.getAllDisputes.bind(this)
    );

    // Order hold release (moderators only)
    router.post('/:disputeId/order-hold-release', 
      this.authMiddleware.requireAuth,
      this.authMiddleware.requireModerator,
      this.orderHoldRelease.bind(this)
    );

    // Create return shipment label (moderators only)
    router.post('/:disputeId/create-shipment-label', 
      this.authMiddleware.requireAuth,
      this.authMiddleware.requireModerator,
      this.createReturnShipmentLabel.bind(this)
    );

    // Apply ban (moderators only)
    router.post('/:disputeId/apply-ban', 
      this.authMiddleware.requireAuth,
      this.authMiddleware.requireModerator,
      this.applyBan.bind(this)
    );

    // Get ban levels (moderators only)
    router.get('/ban-levels', 
      this.authMiddleware.requireAuth,
      this.authMiddleware.requireModerator,
      this.getBanLevels.bind(this)
    );
  }

  async createDispute(req, res) {
    try {
      const { holdId } = req.params;
      const { disputeType, description, additionalPhotos } = req.body;
      const initiatedBy = req.user.id;

      // Validate required fields
      if (!disputeType || !description) {
        return res.status(400).json({ error: 'Dispute type and description are required' });
      }

      const validDisputeTypes = ['condition', 'damage', 'missing', 'other'];
      if (!validDisputeTypes.includes(disputeType)) {
        return res.status(400).json({ error: 'Invalid dispute type' });
      }

      const dispute = await this.disputeService.createDispute(
        holdId,
        initiatedBy,
        disputeType,
        description,
        additionalPhotos || []
      );

      res.status(201).json({
        success: true,
        message: 'Dispute created successfully',
        dispute
      });
    } catch (error) {
      console.error('(with holdId ' + req.params.holdId + ' and disputeType ' + req.body.disputeType + ' and description ' + req.body.description + ') Create dispute error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async updateDispute(req, res) {
    try {
      const { disputeId } = req.params;
      const updates = req.body;
      const updatedBy = req.user.id;

      const dispute = await this.disputeService.updateDispute(disputeId, updates, updatedBy);

      res.json({
        success: true,
        message: 'Dispute updated successfully',
        dispute
      });
    } catch (error) {
      console.error('(with disputeId ' + req.params.disputeId + ' and updates ' + JSON.stringify(req.body) + ') Update dispute error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async resolveDispute(req, res) {
    try {
      const { disputeId } = req.params;
      const { resolution, moderationNotes, moderationActions } = req.body;
      const resolvedBy = req.user.id;

      if (!resolution) {
        return res.status(400).json({ error: 'Resolution is required' });
      }

      const dispute = await this.disputeService.resolveDispute(
        disputeId,
        resolvedBy,
        resolution,
        moderationNotes || '',
        moderationActions || {}
      );

      res.json({
        success: true,
        message: 'Dispute resolved successfully',
        dispute
      });
    } catch (error) {
      console.error('(with disputeId ' + req.params.disputeId + ' and resolution ' + req.body.resolution + ') Resolve dispute error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async orderHoldRelease(req, res) {
    try {
      const { disputeId } = req.params;
      const moderatorId = req.user.id;

      const hold = await this.disputeService.orderHoldRelease(disputeId, moderatorId);

      res.json({
        success: true,
        message: 'Hold release ordered successfully',
        hold
      });
    } catch (error) {
      console.error('(with disputeId ' + req.params.disputeId + ') Order hold release error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async createReturnShipmentLabel(req, res) {
    try {
      const { disputeId } = req.params;
      const moderatorId = req.user.id;

      const shipmentLabel = await this.disputeService.createReturnShipmentLabel(disputeId, moderatorId);

      res.json({
        success: true,
        message: 'Return shipment label created successfully',
        shipmentLabel
      });
    } catch (error) {
      console.error('(with disputeId ' + req.params.disputeId + ') Create return shipment label error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async applyBan(req, res) {
    try {
      const { disputeId } = req.params;
      const { userId, banLevel, reason, expiryDate, disbursementInfo } = req.body;
      const moderatorId = req.user.id;

      if (!userId || !banLevel || !reason) {
        return res.status(400).json({ error: 'User ID, ban level, and reason are required' });
      }

      const validBanLevels = ['no-buy', 'no-list', 'hide', 'ip-ban', 'email-ban', 'unlist'];
      if (!validBanLevels.includes(banLevel)) {
        return res.status(400).json({ error: 'Invalid ban level' });
      }

      const user = await this.disputeService.applyBan(disputeId, {
        userId,
        banLevel,
        reason,
        expiryDate,
        disbursementInfo
      }, moderatorId);

      res.json({
        success: true,
        message: `User banned with level: ${banLevel}`,
        user
      });
    } catch (error) {
      console.error('(with disputeId ' + req.params.disputeId + ' and banDetails ' + JSON.stringify(req.body) + ') Apply ban error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async getBanLevels(req, res) {
    try {
      const banLevels = [
        {
          level: 'no-buy',
          name: 'No Buy',
          description: 'User cannot purchase or place holds on items',
          duration: 'Configurable',
          impact: 'Temporary restriction on buying'
        },
        {
          level: 'no-list',
          name: 'No List',
          description: 'User cannot list new items for sale',
          duration: 'Configurable',
          impact: 'Temporary restriction on selling'
        },
        {
          level: 'hide',
          name: 'Hide',
          description: 'User profile and items are hidden from public view',
          duration: 'Configurable',
          impact: 'Profile and items become invisible'
        },
        {
          level: 'ip-ban',
          name: 'IP Ban',
          description: 'User is banned by IP address',
          duration: 'Permanent',
          impact: 'Cannot access from current IP'
        },
        {
          level: 'email-ban',
          name: 'Email Ban',
          description: 'User email is banned from the platform',
          duration: 'Permanent',
          impact: 'Cannot register with this email'
        },
        {
          level: 'unlist',
          name: 'Unlist',
          description: 'All user items are automatically unlisted',
          duration: 'Immediate',
          impact: 'All items removed from marketplace'
        }
      ];

      res.json({
        success: true,
        banLevels
      });
    } catch (error) {
      console.error('Get ban levels error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async getDispute(req, res) {
    try {
      const { disputeId } = req.params;
      const userId = req.user.id;

      const dispute = await this.disputeService.getDispute(disputeId, userId);

      res.json({
        success: true,
        dispute
      });
    } catch (error) {
      console.error('(with disputeId ' + req.params.disputeId + ' and userId ' + req.user.id + ') Get dispute error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async getHoldDisputes(req, res) {
    try {
      const { holdId } = req.params;
      const userId = req.user.id;

      const disputes = await this.disputeService.getHoldDisputes(holdId, userId);

      res.json({
        success: true,
        disputes
      });
    } catch (error) {
      console.error('(with holdId ' + req.params.holdId + ' and userId ' + req.user.id + ') Get hold disputes error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async getDisputeStats(req, res) {
    try {
      const stats = await this.disputeService.getDisputeStats();

      res.json({
        success: true,
        stats
      });
    } catch (error) {
      console.error('Get dispute stats error:', error);
      res.status(400).json({ error: error.message });
    }
  }

  async getAllDisputes(req, res) {
    try {
      const { page = 1, limit = 20, status, type, banLevel } = req.query;
      const userId = req.user.id;

      // Verify user is moderator
      const user = await this.disputeService.userRepository.findOne({ id: userId });
      if (!user || !user.isModerator) {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const where = {};
      if (status) where.status = status;
      if (type) where.disputeType = type;
      if (banLevel) where.banLevel = banLevel;

      const disputes = await this.disputeService.disputeRepository.find(
        where,
        { 
          orderBy: { createdAt: 'DESC' },
          limit: parseInt(limit),
          offset: (parseInt(page) - 1) * parseInt(limit)
        }
      );

      const total = await this.disputeService.disputeRepository.count(where);

      res.json({
        success: true,
        disputes,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      });
    } catch (error) {
      console.error('(with page ' + req.query.page + ' and limit ' + req.query.limit + ' and status ' + req.query.status + ' and type ' + req.query.type + ') Get all disputes error:', error);
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = { DisputeController, router }; 