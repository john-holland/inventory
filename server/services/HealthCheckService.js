"use strict";

const axios = require('axios');

class HealthCheckService {
  constructor(em) {
    this.em = em;
    this.healthCheckRepository = em.getRepository('HealthCheck');
    this.userRepository = em.getRepository('User');
    this.notificationService = null; // Will be injected
  }

  /**
   * Set notification service reference
   */
  setNotificationService(notificationService) {
    this.notificationService = notificationService;
  }

  /**
   * Check if auto health check is enabled
   */
  async isAutoHealthCheckEnabled() {
    try {
      const adminUsers = await this.userRepository.find({ 
        role: { $in: ['ADMIN', 'IT_ADMIN', 'HR_ADMIN'] } 
      });

      for (const admin of adminUsers) {
        if (admin.unleashToggles && admin.unleashToggles.autoHealthcheckHousekeeping?.enabled) {
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error checking auto health check status:', error);
      return false;
    }
  }

  /**
   * Perform health check for Amazon
   */
  async checkAmazonHealth() {
    const startTime = Date.now();
    let status = 'healthy';
    let errorMessage = null;
    let responseTime = null;

    try {
      // Simple health check - try to search for a common item
      const response = await axios.get('https://webservices.amazon.com/onca/xml', {
        params: {
          Service: 'AWSECommerceService',
          Operation: 'ItemSearch',
          Keywords: 'test',
          SearchIndex: 'All',
          ResponseGroup: 'Small',
          Version: '2013-08-01'
        },
        timeout: 10000 // 10 second timeout
      });

      responseTime = Date.now() - startTime;
      
      if (response.status !== 200) {
        status = 'degraded';
        errorMessage = `HTTP ${response.status}`;
      }
    } catch (error) {
      responseTime = Date.now() - startTime;
      status = 'down';
      errorMessage = error.message;
    }

    return { status, responseTime, errorMessage };
  }

  /**
   * Perform health check for eBay
   */
  async checkEbayHealth() {
    const startTime = Date.now();
    let status = 'healthy';
    let errorMessage = null;
    let responseTime = null;

    try {
      // Simple health check - try to access eBay API
      const response = await axios.get('https://api.ebay.com/buy/browse/v1/item_summary/search', {
        params: { q: 'test', limit: 1 },
        timeout: 10000 // 10 second timeout
      });

      responseTime = Date.now() - startTime;
      
      if (response.status !== 200) {
        status = 'degraded';
        errorMessage = `HTTP ${response.status}`;
      }
    } catch (error) {
      responseTime = Date.now() - startTime;
      status = 'down';
      errorMessage = error.message;
    }

    return { status, responseTime, errorMessage };
  }

  /**
   * Update health check record
   */
  async updateHealthCheck(service, healthData) {
    try {
      let healthCheck = await this.healthCheckRepository.findOne({ service });
      
      if (!healthCheck) {
        healthCheck = this.healthCheckRepository.create({
          service,
          status: healthData.status,
          responseTime: healthData.responseTime,
          errorMessage: healthData.errorMessage,
          lastChecked: new Date()
        });
      } else {
        healthCheck.status = healthData.status;
        healthCheck.responseTime = healthData.responseTime;
        healthCheck.errorMessage = healthData.errorMessage;
        healthCheck.lastChecked = new Date();
        healthCheck.updatedAt = new Date();
      }

      // Update consecutive failures
      if (healthData.status === 'down' || healthData.status === 'degraded') {
        healthCheck.consecutiveFailures += 1;
      } else {
        healthCheck.consecutiveFailures = 0;
      }

      await this.healthCheckRepository.persistAndFlush(healthCheck);
      return healthCheck;
    } catch (error) {
      console.error(`Error updating health check for ${service}:`, error);
      throw error;
    }
  }

  /**
   * Auto-disable service if health check fails
   */
  async autoDisableService(service, healthCheck) {
    try {
      // Check if auto health check is enabled
      if (!(await this.isAutoHealthCheckEnabled())) {
        return false;
      }

      // Auto-disable after 3 consecutive failures
      if (healthCheck.consecutiveFailures >= 3 && !healthCheck.autoDisabled) {
        // Disable the integration toggle
        const adminUsers = await this.userRepository.find({ 
          role: { $in: ['ADMIN', 'IT_ADMIN', 'HR_ADMIN'] } 
        });

        for (const admin of adminUsers) {
          if (admin.unleashToggles) {
            const toggleKey = service === 'amazon' ? 'amazonIntegration' : 'ebayIntegration';
            admin.unleashToggles[toggleKey] = {
              enabled: false,
              description: `Auto-disabled due to health check failures (${healthCheck.consecutiveFailures} consecutive)`,
              lastModifiedBy: 'system',
              lastModifiedAt: new Date(),
              autoDisabled: true
            };
            await this.userRepository.persistAndFlush(admin);
            break; // Only update the first admin user
          }
        }

        // Update health check record
        healthCheck.autoDisabled = true;
        healthCheck.autoDisabledAt = new Date();
        healthCheck.autoDisabledBy = 'system';
        await this.healthCheckRepository.persistAndFlush(healthCheck);

        // Send notification to IT employees
        await this.notifyITEmployees(service, 'auto_disabled', healthCheck);

        console.log(`🚨 Auto-disabled ${service} integration due to health check failures`);
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Error auto-disabling ${service}:`, error);
      return false;
    }
  }

  /**
   * Auto-re-enable service if health check recovers
   */
  async autoReEnableService(service, healthCheck) {
    try {
      // Check if auto health check is enabled
      if (!(await this.isAutoHealthCheckEnabled())) {
        return false;
      }

      // Re-enable if service was auto-disabled and is now healthy
      if (healthCheck.autoDisabled && healthCheck.status === 'healthy' && healthCheck.consecutiveFailures === 0) {
        // Re-enable the integration toggle
        const adminUsers = await this.userRepository.find({ 
          role: { $in: ['ADMIN', 'IT_ADMIN', 'HR_ADMIN'] } 
        });

        for (const admin of adminUsers) {
          if (admin.unleashToggles) {
            const toggleKey = service === 'amazon' ? 'amazonIntegration' : 'ebayIntegration';
            admin.unleashToggles[toggleKey] = {
              enabled: true,
              description: `Auto-re-enabled after health recovery`,
              lastModifiedBy: 'system',
              lastModifiedAt: new Date(),
              autoDisabled: false
            };
            await this.userRepository.persistAndFlush(admin);
            break; // Only update the first admin user
          }
        }

        // Update health check record
        healthCheck.autoDisabled = false;
        healthCheck.reEnabledAt = new Date();
        healthCheck.reEnabledBy = 'system';
        await this.healthCheckRepository.persistAndFlush(healthCheck);

        // Send notification to IT employees
        await this.notifyITEmployees(service, 'auto_re_enabled', healthCheck);

        console.log(`✅ Auto-re-enabled ${service} integration after health recovery`);
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Error auto-re-enabling ${service}:`, error);
      return false;
    }
  }

  /**
   * Notify IT employees of health check changes
   */
  async notifyITEmployees(service, event, healthCheck) {
    if (!this.notificationService) {
      console.warn('Notification service not available');
      return;
    }

    try {
      const itEmployees = await this.userRepository.find({ 
        role: 'IT_EMPLOYEE' 
      });

      const eventMessages = {
        'auto_disabled': `${service.toUpperCase()} integration has been automatically disabled due to ${healthCheck.consecutiveFailures} consecutive health check failures.`,
        'auto_re_enabled': `${service.toUpperCase()} integration has been automatically re-enabled after health recovery.`,
        'health_degraded': `${service.toUpperCase()} integration is experiencing degraded performance.`,
        'health_down': `${service.toUpperCase()} integration is currently down.`
      };

      const message = eventMessages[event] || `${service.toUpperCase()} health check event: ${event} for health check ${JSON.stringify(healthCheck)}`;

      for (const employee of itEmployees) {
        await this.notificationService.createNotification({
          userId: employee.id,
          title: `Marketplace Health Alert - ${service.toUpperCase()}`,
          message: message,
          type: 'health_check',
          priority: event.includes('down') ? 'high' : 'medium',
          data: {
            service,
            event,
            healthCheckId: healthCheck.id,
            status: healthCheck.status,
            responseTime: healthCheck.responseTime
          }
        });
      }
    } catch (error) {
      console.error('Error notifying IT employees:', error);
    }
  }

  /**
   * Run health checks for all services
   */
  async runHealthChecks() {
    try {
      console.log('🏥 Running marketplace health checks...');

      // Check Amazon health
      const amazonHealth = await this.checkAmazonHealth();
      const amazonRecord = await this.updateHealthCheck('amazon', amazonHealth);
      
      // Check if auto-disable is needed
      await this.autoDisableService('amazon', amazonRecord);
      await this.autoReEnableService('amazon', amazonRecord);

      // Check eBay health
      const ebayHealth = await this.checkEbayHealth();
      const ebayRecord = await this.updateHealthCheck('ebay', ebayHealth);
      
      // Check if auto-disable is needed
      await this.autoDisableService('ebay', ebayRecord);
      await this.autoReEnableService('ebay', ebayRecord);

      console.log('✅ Health checks completed');
      return { amazon: amazonRecord, ebay: ebayRecord };
    } catch (error) {
      console.error('❌ Health checks failed:', error);
      throw error;
    }
  }

  /**
   * Get health check history
   */
  async getHealthCheckHistory(service = null, limit = 100) {
    try {
      const query = {};
      if (service) {
        query.service = service;
      }

      const healthChecks = await this.healthCheckRepository.find(query, {
        orderBy: { lastChecked: 'DESC' },
        limit
      });

      return healthChecks;
    } catch (error) {
      console.error('Error getting health check history:', error);
      throw error;
    }
  }

  /**
   * Get current health status
   */
  async getCurrentHealthStatus() {
    try {
      const amazonHealth = await this.healthCheckRepository.findOne({ service: 'amazon' });
      const ebayHealth = await this.healthCheckRepository.findOne({ service: 'ebay' });

      return {
        amazon: amazonHealth || { status: 'unknown', lastChecked: null },
        ebay: ebayHealth || { status: 'unknown', lastChecked: null },
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('Error getting current health status:', error);
      throw error;
    }
  }
}

module.exports = HealthCheckService; 