"use strict";

const { Router } = require('express');
const UnleashService = require('../services/UnleashService');

class UnleashController {
  constructor(em) {
    this.em = em;
    this.unleashService = new UnleashService(em);
    this.router = Router();
    this.setupRoutes();
  }

  setupRoutes() {
    // Get all Unleash toggles (admin only)
    this.router.get('/toggles', this.requireUnleashAccess.bind(this), this.getToggles.bind(this));
    
    // Update a specific Unleash toggle (admin only)
    this.router.post('/toggles', this.requireUnleashAccess.bind(this), this.updateToggle.bind(this));
    
    // Check if a feature is enabled
    this.router.get('/feature/:featureKey', this.checkFeature.bind(this));
    
    // Get toggle analytics (admin only)
    this.router.get('/analytics', this.requireUnleashAccess.bind(this), this.getAnalytics.bind(this));
    
    // Reset all toggles to default (admin only)
    this.router.post('/reset', this.requireUnleashAccess.bind(this), this.resetToggles.bind(this));
    
    // Emergency controls (admin only)
    this.router.post('/emergency-disable', this.requireUnleashAccess.bind(this), this.emergencyDisable.bind(this));
    this.router.post('/re-enable', this.requireUnleashAccess.bind(this), this.reEnable.bind(this));
    
    // Get available toggle keys
    this.router.get('/keys', this.getToggleKeys.bind(this));
  }

  /**
   * Unleash access middleware
   */
  async requireUnleashAccess(req, res, next) {
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

      const unleashRoles = ['ADMIN', 'IT_ADMIN', 'HR_ADMIN'];
      if (!unleashRoles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          error: 'Unleash feature flag access requires admin privileges'
        });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('Unleash auth error:', error);
      return res.status(401).json({
        success: false,
        error: 'Authentication failed'
      });
    }
  }

  /**
   * Get all Unleash toggles (admin only)
   */
  async getToggles(req, res) {
    try {
      const toggles = await this.unleashService.getToggles(req.user);
      res.json({
        success: true,
        data: toggles,
        message: 'Unleash toggles retrieved successfully'
      });
    } catch (error) {
      res.status(403).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Update a specific Unleash toggle (admin only)
   */
  async updateToggle(req, res) {
    try {
      const { toggleKey, enabled, description } = req.body;
      
      if (!toggleKey) {
        return res.status(400).json({
          success: false,
          error: 'Toggle key is required'
        });
      }

      const updatedToggle = await this.unleashService.updateToggle(
        req.user, 
        toggleKey, 
        enabled, 
        description
      );

      res.json({
        success: true,
        data: updatedToggle,
        message: `Toggle "${toggleKey}" ${enabled ? 'enabled' : 'disabled'} successfully`
      });
    } catch (error) {
      res.status(403).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Check if a feature is enabled
   */
  async checkFeature(req, res) {
    try {
      const { featureKey } = req.params;
      
      // Try to get user from token if available
      let user = null;
      try {
        const token = req.headers.authorization?.split(' ')[1];
        if (token) {
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
          const userRepository = this.em.getRepository('User');
          user = await userRepository.findOne({ id: decoded.userId });
        }
      } catch (error) {
        // Token invalid or no token, continue without user
      }
      
      const enabled = await this.unleashService.isFeatureEnabled(featureKey, user);
      
      res.json({
        success: true,
        data: { featureKey, enabled },
        message: `Feature "${featureKey}" is ${enabled ? 'enabled' : 'disabled'}`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get toggle analytics (admin only)
   */
  async getAnalytics(req, res) {
    try {
      const analytics = await this.unleashService.getToggleAnalytics();
      
      res.json({
        success: true,
        data: analytics,
        message: 'Toggle analytics retrieved successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Reset all toggles to default (admin only)
   */
  async resetToggles(req, res) {
    try {
      const defaultToggles = await this.unleashService.resetToggles(req.user);
      
      res.json({
        success: true,
        data: defaultToggles,
        message: 'All toggles reset to default state'
      });
    } catch (error) {
      res.status(403).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Emergency controls (admin only)
   */
  async emergencyDisable(req, res) {
    try {
      const { integrations } = req.body;
      
      if (!integrations || !Array.isArray(integrations)) {
        return res.status(400).json({
          success: false,
          error: 'Integrations array is required'
        });
      }

      const disabledToggles = [];
      
      for (const integration of integrations) {
        const updatedToggle = await this.unleashService.updateToggle(
          req.user, 
          integration, 
          false, 
          `Emergency disabled by ${req.user.username} at ${new Date().toISOString()}`
        );
        disabledToggles.push(integration);
      }

      console.log(`🚨 Emergency disable executed by ${req.user.username}:`, disabledToggles);

      res.json({
        success: true,
        data: { disabledToggles },
        message: `Emergency disabled ${disabledToggles.length} integration(s)`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  async reEnable(req, res) {
    try {
      const { integrations } = req.body;
      
      if (!integrations || !Array.isArray(integrations)) {
        return res.status(400).json({
          success: false,
          error: 'Integrations array is required'
        });
      }

      const enabledToggles = [];
      
      for (const integration of integrations) {
        const updatedToggle = await this.unleashService.updateToggle(
          req.user, 
          integration, 
          true, 
          `Re-enabled by ${req.user.username} at ${new Date().toISOString()}`
        );
        enabledToggles.push(integration);
      }

      console.log(`✅ Re-enable executed by ${req.user.username}:`, enabledToggles);

      res.json({
        success: true,
        data: { enabledToggles },
        message: `Re-enabled ${enabledToggles.length} integration(s)`
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get available toggle keys
   */
  async getToggleKeys(req, res) {
    const toggleKeys = [
      'newFeatures',
      'betaFeatures', 
      'advancedAnalytics',
      'aiIntegration',
      'realTimeNotifications',
      'darkMode',
      'mobileOptimization',
      'performanceMode',
      'amazonIntegration',
      'ebayIntegration',
      'marketplaceSearch',
      'autoSync'
    ];

    res.json({
      success: true,
      data: toggleKeys,
      message: 'Available toggle keys retrieved'
    });
  }
}

module.exports = UnleashController; 