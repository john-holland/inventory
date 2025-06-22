"use strict";

const { Router } = require('express');

class BanRequestController {
  constructor(em) {
    this.em = em;
    this.banRequestService = null; // Will be injected
    this.router = Router();
    this.setupRoutes();
  }

  setBanRequestService(banRequestService) {
    this.banRequestService = banRequestService;
  }

  setupRoutes() {
    // Create ban request (CSR only)
    this.router.post('/create', this.requireCSRAccess.bind(this), this.createBanRequest.bind(this));
    
    // Get ban requests for CSR
    this.router.get('/csr', this.requireCSRAccess.bind(this), this.getCSRBanRequests.bind(this));
    
    // Get pending ban requests (Admin only)
    this.router.get('/pending', this.requireAdminAccess.bind(this), this.getPendingBanRequests.bind(this));
    
    // Vote on ban request (Admin and CSR employees)
    this.router.post('/vote/:requestId', this.requireVotingAccess.bind(this), this.voteOnBanRequest.bind(this));
    
    // Get ban request details
    this.router.get('/:requestId', this.getBanRequestDetails.bind(this));
  }

  /**
   * CSR access middleware
   */
  async requireCSRAccess(req, res, next) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      
      const userRepository = this.em.getRepository('User');
      const user = await userRepository.findOne({ id: decoded.userId });
      
      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or inactive user'
        });
      }

      const csrRoles = ['CUSTOMER_SUPPORT_ROLE_EMPLOYEE', 'ADMIN', 'IT_ADMIN', 'HR_ADMIN'];
      if (!csrRoles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          error: 'CSR access required'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('CSR auth error:', error);
      return res.status(401).json({
        success: false,
        error: 'Authentication failed'
      });
    }
  }

  /**
   * Admin access middleware
   */
  async requireAdminAccess(req, res, next) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      
      const userRepository = this.em.getRepository('User');
      const user = await userRepository.findOne({ id: decoded.userId });
      
      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or inactive user'
        });
      }

      const adminRoles = ['ADMIN', 'IT_ADMIN', 'HR_ADMIN'];
      if (!adminRoles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          error: 'Admin access required'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('Admin auth error:', error);
      return res.status(401).json({
        success: false,
        error: 'Authentication failed'
      });
    }
  }

  /**
   * Voting access middleware (Admin and CSR employees)
   */
  async requireVotingAccess(req, res, next) {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required'
        });
      }

      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      
      const userRepository = this.em.getRepository('User');
      const user = await userRepository.findOne({ id: decoded.userId });
      
      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          error: 'Invalid or inactive user'
        });
      }

      const votingRoles = ['ADMIN', 'IT_ADMIN', 'HR_ADMIN', 'CSR_ADMIN', 'CUSTOMER_SUPPORT_ROLE_EMPLOYEE'];
      if (!votingRoles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          error: 'Voting access required (Admin or CSR role)'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('Voting auth error:', error);
      return res.status(401).json({
        success: false,
        error: 'Authentication failed'
      });
    }
  }

  /**
   * Create a new ban request
   */
  async createBanRequest(req, res) {
    try {
      if (!this.banRequestService) {
        return res.status(500).json({
          success: false,
          error: 'Ban request service not available'
        });
      }

      const { targetUserId, banLevel, reason, evidence, type } = req.body;

      if (!targetUserId || !banLevel || !reason) {
        return res.status(400).json({
          success: false,
          error: 'Target user ID, ban level, and reason are required'
        });
      }

      const banRequest = await this.banRequestService.createBanRequest({
        targetUserId,
        requestedBy: req.user.id,
        banLevel,
        reason,
        evidence,
        type: type || 'ban_request'
      });

      res.json({
        success: true,
        data: banRequest,
        message: 'Ban request created successfully'
      });
    } catch (error) {
      console.error('Error creating ban request:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get ban requests for CSR user
   */
  async getCSRBanRequests(req, res) {
    try {
      if (!this.banRequestService) {
        return res.status(500).json({
          success: false,
          error: 'Ban request service not available'
        });
      }

      const { status, type, limit } = req.query;
      const filters = { status, type, limit: parseInt(limit) || 50 };

      const banRequests = await this.banRequestService.getBanRequestsForCSR(req.user.id, filters);

      res.json({
        success: true,
        data: banRequests,
        message: 'Ban requests retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting CSR ban requests:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get pending ban requests for admin users
   */
  async getPendingBanRequests(req, res) {
    try {
      if (!this.banRequestService) {
        return res.status(500).json({
          success: false,
          error: 'Ban request service not available'
        });
      }

      const banRequests = await this.banRequestService.getPendingBanRequests();

      res.json({
        success: true,
        data: banRequests,
        message: 'Pending ban requests retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting pending ban requests:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Vote on a ban request
   */
  async voteOnBanRequest(req, res) {
    try {
      if (!this.banRequestService) {
        return res.status(500).json({
          success: false,
          error: 'Ban request service not available'
        });
      }

      const { requestId } = req.params;
      const { vote, rejectionReason } = req.body;

      if (!vote || !['approve', 'reject'].includes(vote)) {
        return res.status(400).json({
          success: false,
          error: 'Valid vote (approve/reject) is required'
        });
      }

      const banRequest = await this.banRequestService.voteOnBanRequest(
        requestId, 
        req.user.id, 
        vote,
        rejectionReason
      );

      res.json({
        success: true,
        data: banRequest,
        message: 'Vote recorded successfully'
      });
    } catch (error) {
      console.error('Error voting on ban request:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get ban request details
   */
  async getBanRequestDetails(req, res) {
    try {
      if (!this.banRequestService) {
        return res.status(500).json({
          success: false,
          error: 'Ban request service not available'
        });
      }

      const { requestId } = req.params;
      const banRequest = await this.banRequestService.getBanRequestById(requestId);

      if (!banRequest) {
        return res.status(404).json({
          success: false,
          error: 'Ban request not found'
        });
      }

      res.json({
        success: true,
        data: banRequest,
        message: 'Ban request details retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting ban request details:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = BanRequestController; 