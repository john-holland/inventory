"use strict";

class IntegrationToggleService {
  constructor(em) {
    this.em = em;
  }

  /**
   * Check if Amazon integration is enabled
   */
  async isAmazonEnabled(user = null) {
    return await this.isFeatureEnabled('amazonIntegration', user);
  }

  /**
   * Check if eBay integration is enabled
   */
  async isEbayEnabled(user = null) {
    return await this.isFeatureEnabled('ebayIntegration', user);
  }

  /**
   * Check if marketplace search is enabled
   */
  async isMarketplaceSearchEnabled(user = null) {
    return await this.isFeatureEnabled('marketplaceSearch', user);
  }

  /**
   * Check if auto sync is enabled
   */
  async isAutoSyncEnabled(user = null) {
    return await this.isFeatureEnabled('autoSync', user);
  }

  /**
   * Check if a specific feature is enabled
   */
  async isFeatureEnabled(featureKey, user = null) {
    try {
      // If no user provided, check global admin settings
      if (!user) {
        const adminUsers = await this.em.find('User', { 
          role: { $in: ['ADMIN', 'IT_ADMIN', 'HR_ADMIN'] } 
        });

        for (const admin of adminUsers) {
          if (admin.unleashToggles && admin.unleashToggles[featureKey]?.enabled) {
            return true;
          }
        }
        return false;
      }

      // Check user-specific toggles first
      if (user.unleashToggles && user.unleashToggles[featureKey]?.enabled) {
        return true;
      }

      // Fall back to global admin settings
      const adminUsers = await this.em.find('User', { 
        role: { $in: ['ADMIN', 'IT_ADMIN', 'HR_ADMIN'] } 
      });

      for (const admin of adminUsers) {
        if (admin.unleashToggles && admin.unleashToggles[featureKey]?.enabled) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error(`Error checking feature ${featureKey}:`, error);
      return false; // Default to disabled on error
    }
  }

  /**
   * Get integration status for all marketplaces
   */
  async getIntegrationStatus(user = null) {
    return {
      amazon: await this.isAmazonEnabled(user),
      ebay: await this.isEbayEnabled(user),
      marketplaceSearch: await this.isMarketplaceSearchEnabled(user),
      autoSync: await this.isAutoSyncEnabled(user)
    };
  }

  /**
   * Validate marketplace access before operations
   */
  async validateMarketplaceAccess(marketplace, user = null) {
    const isEnabled = marketplace === 'amazon' 
      ? await this.isAmazonEnabled(user)
      : await this.isEbayEnabled(user);

    if (!isEnabled) {
      throw new Error(`${marketplace} integration is currently disabled. Please contact an administrator.`);
    }

    return true;
  }

  /**
   * Get disabled integrations for user feedback
   */
  async getDisabledIntegrations(user = null) {
    const status = await this.getIntegrationStatus(user);
    const disabled = [];

    if (!status.amazon) disabled.push('Amazon');
    if (!status.ebay) disabled.push('eBay');
    if (!status.marketplaceSearch) disabled.push('Marketplace Search');
    if (!status.autoSync) disabled.push('Auto Sync');

    return disabled;
  }

  /**
   * Emergency disable all marketplace integrations
   */
  async emergencyDisableIntegrations(adminUser) {
    if (!['ADMIN', 'IT_ADMIN', 'HR_ADMIN'].includes(adminUser.role)) {
      throw new Error('Insufficient permissions for emergency operations');
    }

    const integrations = ['amazonIntegration', 'ebayIntegration', 'marketplaceSearch', 'autoSync'];
    
    for (const integration of integrations) {
      if (!adminUser.unleashToggles) {
        adminUser.unleashToggles = {};
      }
      
      adminUser.unleashToggles[integration] = {
        enabled: false,
        description: adminUser.unleashToggles[integration]?.description || 'Integration disabled',
        lastModifiedBy: adminUser.username,
        lastModifiedAt: new Date(),
        emergencyDisabled: true
      };
    }

    await this.em.persistAndFlush(adminUser);
    
    console.log(`🚨 Emergency integration disable executed by ${adminUser.username}`);
    
    return {
      success: true,
      message: 'All marketplace integrations have been emergency disabled',
      disabledIntegrations: integrations
    };
  }

  /**
   * Re-enable integrations after emergency
   */
  async reEnableIntegrations(adminUser, integrations = ['amazonIntegration', 'ebayIntegration']) {
    if (!['ADMIN', 'IT_ADMIN', 'HR_ADMIN'].includes(adminUser.role)) {
      throw new Error('Insufficient permissions for emergency operations');
    }

    if (!adminUser.unleashToggles) {
      adminUser.unleashToggles = {};
    }

    for (const integration of integrations) {
      adminUser.unleashToggles[integration] = {
        enabled: true,
        description: adminUser.unleashToggles[integration]?.description || 'Integration re-enabled',
        lastModifiedBy: adminUser.username,
        lastModifiedAt: new Date(),
        emergencyDisabled: false
      };
    }

    await this.em.persistAndFlush(adminUser);
    
    console.log(`✅ Integration re-enable executed by ${adminUser.username}`);
    
    return {
      success: true,
      message: 'Selected integrations have been re-enabled',
      enabledIntegrations: integrations
    };
  }
}

module.exports = IntegrationToggleService; 