"use strict";

class UnleashService {
  constructor(em) {
    this.em = em;
  }

  /**
   * Check if user has admin access to Unleash toggles
   */
  hasAdminAccess(user) {
    return ['ADMIN', 'IT_ADMIN', 'HR_ADMIN'].includes(user.role);
  }

  /**
   * Get all Unleash toggles for admin users
   */
  async getToggles(user) {
    if (!this.hasAdminAccess(user)) {
      throw new Error('Insufficient permissions to access Unleash toggles');
    }

    // Get global toggles from admin users
    const adminUsers = await this.em.find('User', { 
      role: { $in: ['ADMIN', 'IT_ADMIN', 'HR_ADMIN'] } 
    });

    const globalToggles = {};
    
    adminUsers.forEach(admin => {
      if (admin.unleashToggles) {
        Object.keys(admin.unleashToggles).forEach(toggleKey => {
          if (!globalToggles[toggleKey]) {
            globalToggles[toggleKey] = {
              ...admin.unleashToggles[toggleKey],
              lastModifiedBy: admin.username,
              lastModifiedAt: admin.updatedAt
            };
          }
        });
      }
    });

    return globalToggles;
  }

  /**
   * Update a specific Unleash toggle
   */
  async updateToggle(user, toggleKey, enabled, description = null) {
    if (!this.hasAdminAccess(user)) {
      throw new Error('Insufficient permissions to modify Unleash toggles');
    }

    // Update user's unleash toggles
    if (!user.unleashToggles) {
      user.unleashToggles = {};
    }

    user.unleashToggles[toggleKey] = {
      enabled,
      description: description || user.unleashToggles[toggleKey]?.description || 'No description provided',
      lastModifiedBy: user.username,
      lastModifiedAt: new Date()
    };

    await this.em.persistAndFlush(user);

    // Log the toggle change
    console.log(`Unleash toggle "${toggleKey}" ${enabled ? 'enabled' : 'disabled'} by ${user.username}`);

    return user.unleashToggles[toggleKey];
  }

  /**
   * Check if a specific feature is enabled for a user
   */
  async isFeatureEnabled(featureKey, user = null) {
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
  }

  /**
   * Get toggle usage analytics
   */
  async getToggleAnalytics() {
    const adminUsers = await this.em.find('User', { 
      role: { $in: ['ADMIN', 'IT_ADMIN', 'HR_ADMIN'] } 
    });

    const analytics = {
      totalToggles: 0,
      enabledToggles: 0,
      disabledToggles: 0,
      toggleUsage: {},
      recentChanges: []
    };

    adminUsers.forEach(admin => {
      if (admin.unleashToggles) {
        Object.keys(admin.unleashToggles).forEach(toggleKey => {
          const toggle = admin.unleashToggles[toggleKey];
          
          if (!analytics.toggleUsage[toggleKey]) {
            analytics.toggleUsage[toggleKey] = {
              enabled: false,
              description: toggle.description,
              lastModifiedBy: toggle.lastModifiedBy || admin.username,
              lastModifiedAt: toggle.lastModifiedAt || admin.updatedAt
            };
          }

          if (toggle.enabled) {
            analytics.enabledToggles++;
            analytics.toggleUsage[toggleKey].enabled = true;
          } else {
            analytics.disabledToggles++;
          }

          analytics.totalToggles++;
        });
      }
    });

    return analytics;
  }

  /**
   * Reset all toggles to default state
   */
  async resetToggles(user) {
    if (!this.hasAdminAccess(user)) {
      throw new Error('Insufficient permissions to reset Unleash toggles');
    }

    const defaultToggles = {
      newFeatures: { enabled: false, description: 'Enable new experimental features' },
      betaFeatures: { enabled: false, description: 'Enable beta features for testing' },
      advancedAnalytics: { enabled: false, description: 'Enable advanced analytics dashboard' },
      aiIntegration: { enabled: false, description: 'Enable AI-powered recommendations' },
      realTimeNotifications: { enabled: false, description: 'Enable real-time push notifications' },
      darkMode: { enabled: false, description: 'Enable dark mode theme' },
      mobileOptimization: { enabled: false, description: 'Enable mobile-specific optimizations' },
      performanceMode: { enabled: false, description: 'Enable high-performance mode' }
    };

    user.unleashToggles = defaultToggles;
    await this.em.persistAndFlush(user);

    console.log(`Unleash toggles reset by ${user.username}`);

    return defaultToggles;
  }
}

module.exports = UnleashService; 