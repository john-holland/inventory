const express = require('express');
const { WaitlistService } = require('../services/waitlistService');

class WaitlistController {
  constructor(DI) {
    this.DI = DI;
    this.waitlistService = new WaitlistService(DI);
    this.router = express.Router();
    this.setupRoutes();
  }

  setupRoutes() {
    // Public routes (no authentication required)
    this.router.post('/apply', this.applyToWaitlist.bind(this));
    this.router.get('/status/:email', this.getWaitlistStatus.bind(this));

    // Admin routes (require authentication)
    this.router.get('/admin/entries', this.getWaitlistEntries.bind(this));
    this.router.get('/admin/entries/:id', this.getWaitlistEntry.bind(this));
    this.router.post('/admin/entries/:id/approve', this.approveWaitlistEntry.bind(this));
    this.router.post('/admin/entries/:id/reject', this.rejectWaitlistEntry.bind(this));
    this.router.get('/admin/stats', this.getWaitlistStats.bind(this));

    // Whitelist management
    this.router.get('/admin/whitelist', this.getWhitelistEntries.bind(this));
    this.router.post('/admin/whitelist', this.addWhitelistEntry.bind(this));
    this.router.delete('/admin/whitelist/:id', this.removeWhitelistEntry.bind(this));
    this.router.get('/admin/whitelist/:id', this.getWhitelistEntry.bind(this));

    // Processing routes
    this.router.post('/admin/process-daily', this.processDailyReview.bind(this));
    this.router.post('/admin/auto-approve/:id', this.autoApproveEntry.bind(this));
  }

  // Apply to waitlist (public endpoint)
  async applyToWaitlist(req, res) {
    try {
      const { email, firstName, lastName, phone } = req.body;

      // Validate required fields
      if (!email || !firstName || !lastName) {
        return res.status(400).json({
          success: false,
          message: 'Email, first name, and last name are required'
        });
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address'
        });
      }

      // Get request information
      const requestInfo = {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        referrer: req.get('Referrer')
      };

      const result = await this.waitlistService.addToWaitlist(
        { email, firstName, lastName, phone },
        requestInfo
      );

      res.status(201).json({
        success: true,
        message: result.message,
        data: result.data
      });
    } catch (error) {
      console.error('Error applying to waitlist:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to apply to waitlist'
      });
    }
  }

  // Get waitlist status by email (public endpoint)
  async getWaitlistStatus(req, res) {
    try {
      const { email } = req.params;

      const waitlistEntry = await this.DI.waitlistRepository.findOne({ email });

      if (!waitlistEntry) {
        return res.status(404).json({
          success: false,
          message: 'Email not found in waitlist'
        });
      }

      res.json({
        success: true,
        data: {
          email: waitlistEntry.email,
          status: waitlistEntry.status,
          appliedAt: waitlistEntry.appliedAt,
          approvedAt: waitlistEntry.approvedAt,
          rejectedAt: waitlistEntry.rejectedAt
        }
      });
    } catch (error) {
      console.error('Error getting waitlist status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get waitlist status'
      });
    }
  }

  // Get all waitlist entries (admin)
  async getWaitlistEntries(req, res) {
    try {
      const { page = 1, limit = 10, status, search } = req.query;
      const offset = (page - 1) * limit;

      const where = {};
      if (status) {
        where.status = status;
      }

      if (search) {
        where.$or = [
          { email: { $ilike: `%${search}%` } },
          { firstName: { $ilike: `%${search}%` } },
          { lastName: { $ilike: `%${search}%` } }
        ];
      }

      const [entries, total] = await this.DI.waitlistRepository.findAndCount(where, {
        limit: parseInt(limit),
        offset: parseInt(offset),
        orderBy: { appliedAt: 'DESC' }
      });

      res.json({
        success: true,
        data: entries,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error getting waitlist entries:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get waitlist entries'
      });
    }
  }

  // Get specific waitlist entry (admin)
  async getWaitlistEntry(req, res) {
    try {
      const { id } = req.params;

      const entry = await this.DI.waitlistRepository.findOne({ id: parseInt(id) });

      if (!entry) {
        return res.status(404).json({
          success: false,
          message: 'Waitlist entry not found'
        });
      }

      res.json({
        success: true,
        data: entry
      });
    } catch (error) {
      console.error('Error getting waitlist entry:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get waitlist entry'
      });
    }
  }

  // Approve waitlist entry (admin)
  async approveWaitlistEntry(req, res) {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const adminUserId = req.user?.id || 1; // Get from auth middleware

      const result = await this.waitlistService.approveWaitlist(
        parseInt(id),
        adminUserId,
        notes
      );

      res.json({
        success: true,
        message: result.message,
        data: result.data
      });
    } catch (error) {
      console.error('Error approving waitlist entry:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to approve waitlist entry'
      });
    }
  }

  // Reject waitlist entry (admin)
  async rejectWaitlistEntry(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const adminUserId = req.user?.id || 1; // Get from auth middleware

      if (!reason) {
        return res.status(400).json({
          success: false,
          message: 'Rejection reason is required'
        });
      }

      const result = await this.waitlistService.rejectWaitlist(
        parseInt(id),
        adminUserId,
        reason
      );

      res.json({
        success: true,
        message: result.message,
        data: result.data
      });
    } catch (error) {
      console.error('Error rejecting waitlist entry:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to reject waitlist entry'
      });
    }
  }

  // Get waitlist statistics (admin)
  async getWaitlistStats(req, res) {
    try {
      const result = await this.waitlistService.getWaitlistStats();

      res.json({
        success: true,
        data: result.data
      });
    } catch (error) {
      console.error('Error getting waitlist stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get waitlist statistics'
      });
    }
  }

  // Get whitelist entries (admin)
  async getWhitelistEntries(req, res) {
    try {
      const { page = 1, limit = 10, type, status } = req.query;
      const offset = (page - 1) * limit;

      const where = {};
      if (type) {
        where.type = type;
      }
      if (status) {
        where.status = status;
      }

      const [entries, total] = await this.DI.whitelistRepository.findAndCount(where, {
        limit: parseInt(limit),
        offset: parseInt(offset),
        orderBy: { addedAt: 'DESC' }
      });

      res.json({
        success: true,
        data: entries,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error getting whitelist entries:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get whitelist entries'
      });
    }
  }

  // Add whitelist entry (admin)
  async addWhitelistEntry(req, res) {
    try {
      const { email, firstName, lastName, phone, type, reason } = req.body;
      const adminUserId = req.user?.id || 1; // Get from auth middleware

      if (!email && !phone && !firstName) {
        return res.status(400).json({
          success: false,
          message: 'At least one identifier (email, phone, or name) is required'
        });
      }

      const result = await this.waitlistService.addToWhitelist(
        { email, firstName, lastName, phone, type, reason },
        adminUserId
      );

      res.status(201).json({
        success: true,
        message: result.message,
        data: result.data
      });
    } catch (error) {
      console.error('Error adding whitelist entry:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to add whitelist entry'
      });
    }
  }

  // Remove whitelist entry (admin)
  async removeWhitelistEntry(req, res) {
    try {
      const { id } = req.params;
      const adminUserId = req.user?.id || 1; // Get from auth middleware

      const result = await this.waitlistService.removeFromWhitelist(
        parseInt(id),
        adminUserId
      );

      res.json({
        success: true,
        message: result.message,
        data: result.data
      });
    } catch (error) {
      console.error('Error removing whitelist entry:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to remove whitelist entry'
      });
    }
  }

  // Get specific whitelist entry (admin)
  async getWhitelistEntry(req, res) {
    try {
      const { id } = req.params;

      const entry = await this.DI.whitelistRepository.findOne({ id: parseInt(id) });

      if (!entry) {
        return res.status(404).json({
          success: false,
          message: 'Whitelist entry not found'
        });
      }

      res.json({
        success: true,
        data: entry
      });
    } catch (error) {
      console.error('Error getting whitelist entry:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get whitelist entry'
      });
    }
  }

  // Process daily review (admin)
  async processDailyReview(req, res) {
    try {
      const result = await this.waitlistService.processDailyReview();

      res.json({
        success: true,
        message: result.message,
        data: result.data
      });
    } catch (error) {
      console.error('Error processing daily review:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to process daily review'
      });
    }
  }

  // Auto-approve specific entry (admin)
  async autoApproveEntry(req, res) {
    try {
      const { id } = req.params;

      const result = await this.waitlistService.autoApproveWaitlist(parseInt(id));

      res.json({
        success: true,
        message: result.message,
        data: result.data
      });
    } catch (error) {
      console.error('Error auto-approving entry:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to auto-approve entry'
      });
    }
  }
}

module.exports = { WaitlistController }; 