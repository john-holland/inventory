"use strict";

const { Router } = require('express');

class HealthCheckController {
  constructor(em) {
    this.em = em;
    this.healthCheckService = null; // Will be injected
    this.router = Router();
    this.setupRoutes();
  }

  setHealthCheckService(healthCheckService) {
    this.healthCheckService = healthCheckService;
  }

  setupRoutes() {
    // Get current health status
    this.router.get('/status', this.getCurrentStatus.bind(this));
    
    // Get health check history
    this.router.get('/history', this.getHistory.bind(this));
    
    // Run health checks manually
    this.router.post('/run', this.runHealthChecks.bind(this));
    
    // Get health check configuration
    this.router.get('/config', this.getConfig.bind(this));
  }

  /**
   * Get current health status
   */
  async getCurrentStatus(req, res) {
    try {
      if (!this.healthCheckService) {
        return res.status(500).json({
          success: false,
          error: 'Health check service not available'
        });
      }

      const status = await this.healthCheckService.getCurrentHealthStatus();
      
      res.json({
        success: true,
        data: status,
        message: 'Health status retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting health status:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get health check history
   */
  async getHistory(req, res) {
    try {
      if (!this.healthCheckService) {
        return res.status(500).json({
          success: false,
          error: 'Health check service not available'
        });
      }

      const { service, limit } = req.query;
      const history = await this.healthCheckService.getHealthCheckHistory(service, parseInt(limit) || 100);
      
      res.json({
        success: true,
        data: history,
        message: 'Health check history retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting health check history:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Run health checks manually
   */
  async runHealthChecks(req, res) {
    try {
      if (!this.healthCheckService) {
        return res.status(500).json({
          success: false,
          error: 'Health check service not available'
        });
      }

      const results = await this.healthCheckService.runHealthChecks();
      
      res.json({
        success: true,
        data: results,
        message: 'Health checks completed successfully'
      });
    } catch (error) {
      console.error('Error running health checks:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }

  /**
   * Get health check configuration
   */
  async getConfig(req, res) {
    try {
      const autoHealthCheckEnabled = await this.healthCheckService.isAutoHealthCheckEnabled();
      
      res.json({
        success: true,
        data: {
          autoHealthCheckEnabled,
          services: ['amazon', 'ebay'],
          checkInterval: '5 minutes',
          autoDisableThreshold: 3,
          autoReEnableThreshold: 0
        },
        message: 'Health check configuration retrieved successfully'
      });
    } catch (error) {
      console.error('Error getting health check config:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    }
  }
}

module.exports = HealthCheckController; 