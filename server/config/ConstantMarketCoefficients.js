/**
 * Constant Market Coefficients Configuration
 * 
 * This file contains all configurable constants for the inventory system,
 * including market coefficients, revenue splits, water level adjustments,
 * and other system parameters.
 */

const ConstantMarketCoefficients = {
  // Revenue Distribution Coefficients
  REVENUE: {
    // Consumer-Platform Investment Split (50/50 model)
    CONSUMER_SHARE: 0.50,           // 50% to consumers
    PLATFORM_SHARE: 0.30,           // 30% to platform
    CURATOR_SHARE: 0.15,            // 15% to drop shipping curators
    RESERVE_SHARE: 0.05,            // 5% to reserves/emergency funds
    
    // Hold-Based Investment Model
    HOLD_INVESTMENT: {
      CONSUMER_CUT_MIN: 0.03,       // 3% minimum consumer cut
      CONSUMER_CUT_MAX: 0.20,       // 20% maximum consumer cut
      CONSUMER_CUT_DEFAULT: 0.10,   // 10% default consumer cut
      PLATFORM_CUT: 0.05,           // 5% platform cut from hold investments
      MARKET_CUT: 0.15,             // 15% market cut for collective betting
      HOLD_DURATION_BONUS: 0.02,    // 2% bonus per week of hold duration
      MAX_HOLD_DURATION_BONUS: 0.20 // 20% maximum hold duration bonus
    },
    
    // Commission Structure
    COMMISSIONS: {
      META_MARKETPLACE: {
        SELLER_COMMISSION: 0.05,    // 5% commission to seller
        PLATFORM_COMMISSION: 0.03,  // 3% platform commission
        CURATOR_COMMISSION: 0.02    // 2% curator commission (if in list)
      },
      DROP_SHIPPING: {
        CURATOR_SHARE: 0.15,        // 15% to curator
        PLATFORM_SHARE: 0.05,       // 5% to platform
        TOTAL_COMMISSION: 0.20      // 20% total commission
      },
      AMAZON_AFFILIATE: {
        MIN: 0.04,                  // 4% minimum
        MAX: 0.10,                  // 10% maximum
        DEFAULT: 0.06               // 6% default
      }
    },
    
    // Platform Transaction Fees
    PLATFORM_FEE: {
      MIN: 0.02,                    // 2% minimum
      MAX: 0.05,                    // 5% maximum
      DEFAULT: 0.03                 // 3% default
    }
  },

  // Hold Management Coefficients
  HOLDS: {
    // Hold Requirements
    REQUIREMENTS: {
      SHIPPING_COST_MULTIPLIER: 2,  // 2x shipping cost required
      MIN_HOLD_AMOUNT: 10,          // $10 minimum hold amount
      MAX_HOLD_AMOUNT: 10000,       // $10,000 maximum hold amount
      HOLD_DURATION_LIMIT: 90       // 90 days maximum hold duration
    },
    
    // Hold Status Types
    STATUS: {
      ACTIVE: 'active',
      RELEASED: 'released',
      CANCELLED: 'cancelled',
      EXPIRED: 'expired',
      TRANSFERRED: 'transferred'
    },
    
    // Hold Processing
    PROCESSING: {
      AUTO_EXPIRY_DAYS: 90,         // Auto-expire holds after 90 days
      GRACE_PERIOD_DAYS: 7,         // 7-day grace period before auto-expiry
      REMINDER_DAYS: [30, 15, 7, 1] // Send reminders at these intervals
    }
  },

  // Disbursement Coefficients
  DISBURSEMENT: {
    // Disbursement Types
    TYPES: {
      HOLD_RELEASE: 'hold_release',
      INVESTMENT_RETURN: 'investment_return',
      COMMISSION: 'commission',
      REFUND: 'refund',
      BONUS: 'bonus'
    },
    
    // Payment Methods
    PAYMENT_METHODS: {
      WALLET: 'wallet',
      BANK_TRANSFER: 'bank_transfer',
      PAYPAL: 'paypal',
      CRYPTO: 'crypto'
    },
    
    // Processing
    PROCESSING: {
      AUTO_PROCESSING: true,        // Auto-process disbursements
      BATCH_SIZE: 100,              // Process in batches of 100
      PROCESSING_DELAY_HOURS: 24,   // 24-hour processing delay
      MAX_DAILY_AMOUNT: 10000       // $10,000 maximum daily disbursement
    }
  },

  // Meta Marketplace Coefficients
  META_MARKETPLACE: {
    // Item Status
    STATUS: {
      ACTIVE: 'active',
      INACTIVE: 'inactive',
      SOLD: 'sold',
      RESERVED: 'reserved',
      PENDING_APPROVAL: 'pending_approval'
    },
    
    // Item Condition
    CONDITION: {
      NEW: 'new',
      LIKE_NEW: 'like_new',
      GOOD: 'good',
      FAIR: 'fair',
      POOR: 'poor'
    },
    
    // Shipping Methods
    SHIPPING_METHODS: {
      STANDARD: 'standard',
      EXPRESS: 'express',
      PICKUP: 'pickup',
      LOCAL_DELIVERY: 'local_delivery'
    },
    
    // Limits
    LIMITS: {
      MAX_ITEMS_PER_USER: 100,      // Maximum items per user
      MAX_PRICE: 50000,             // Maximum item price
      MIN_PRICE: 1,                 // Minimum item price
      MAX_IMAGES_PER_ITEM: 10       // Maximum images per item
    }
  },

  // Water Level Management Coefficients
  WATER_LEVEL: {
    // Bill Category Impact Coefficients
    BILL_CATEGORY_IMPACT: {
      SERVER: 0.50,                 // 50% impact on water level
      IT: 0.30,                     // 30% impact on water level
      HR: 0.20,                     // 20% impact on water level
      OTHER: 0.10                   // 10% impact on water level
    },
    
    // Adjustment Types
    ADJUSTMENT_TYPES: {
      INCREASE: 'increase',
      DECREASE: 'decrease',
      THRESHOLD_ADJUSTMENT: 'threshold_adjustment'
    },
    
    // Processing Schedule (cron expressions)
    PROCESSING_SCHEDULE: {
      DAILY_SYNC: '0 5 * * *',      // 5:00 AM daily
      DAILY_PROCESSING: '0 5 * * *', // 5:00 AM daily
      MONTHLY_CALCULATION: '0 4 1 * *' // 4:00 AM 1st of month
    },
    
    // Threshold Limits
    THRESHOLD_LIMITS: {
      MIN: 100,                     // Minimum threshold
      MAX: 1000000,                 // Maximum threshold
      DEFAULT: 10000                // Default threshold
    }
  },

  // Investment Coefficients
  INVESTMENT: {
    // Return Calculation Coefficients
    RETURN_RATES: {
      MIN: 0.02,                    // 2% minimum return
      MAX: 0.15,                    // 15% maximum return
      DEFAULT: 0.08                 // 8% default return
    },
    
    // Investment Limits
    LIMITS: {
      MIN_INVESTMENT: 100,          // Minimum investment amount
      MAX_INVESTMENT: 100000,       // Maximum investment amount
      DAILY_LIMIT: 10000            // Daily investment limit
    },
    
    // Processing Schedule
    PROCESSING_SCHEDULE: {
      WEEKLY_RETURNS: '0 3 * * 0'   // 3:00 AM Sundays
    },

    // Investment Pool Coefficients
    POOL: {
      // Pool Types
      TYPES: {
        INDIVIDUAL: 'individual',
        HERD: 'herd',
        AUTOMATIC: 'automatic'
      },
      
      // Individual Pool Settings
      INDIVIDUAL: {
        MIN_BALANCE: 100,           // Minimum balance required
        MAX_BALANCE: 50000,         // Maximum balance allowed
        DEFAULT_RETURN_RATE: 0.08,  // 8% default return rate
        RISK_PROFILE: 'moderate'     // Default risk profile
      },
      
      // Herd Investment Settings
      HERD: {
        MIN_CONTRIBUTION: 50,       // Minimum contribution to herd
        MAX_CONTRIBUTION: 25000,    // Maximum contribution to herd
        BASE_RETURN_RATE: 0.12,     // 12% base return rate (higher than individual)
        BONUS_MULTIPLIER: 1.5,      // 1.5x bonus for herd participation
        WATER_LEVEL_REQUIREMENT: 0.7, // 70% water level requires herd investment
        MIN_HERD_SIZE: 10,          // Minimum users in herd for activation
        MAX_HERD_SIZE: 1000,        // Maximum users in herd
        RANKING_FACTORS: {
          CONTRIBUTION_WEIGHT: 0.4, // 40% weight for contribution amount
          DURATION_WEIGHT: 0.3,     // 30% weight for participation duration
          PERFORMANCE_WEIGHT: 0.2,  // 20% weight for historical performance
          ACTIVITY_WEIGHT: 0.1      // 10% weight for recent activity
        }
      },
      
      // Automatic Mode Settings
      AUTOMATIC: {
        ENABLED: true,              // Whether automatic mode is enabled
        HERD_THRESHOLD: 0.7,        // Switch to herd when water level is 70%+
        INDIVIDUAL_THRESHOLD: 0.3,  // Switch to individual when water level is 30%-
        REBALANCE_FREQUENCY: 'daily', // How often to rebalance
        REBALANCE_TIME: '0 2 * * *', // 2:00 AM daily rebalancing
        SMOOTHING_FACTOR: 0.1,      // Smoothing factor for transitions
        MAX_REBALANCE_AMOUNT: 0.2   // Maximum 20% rebalance per cycle
      },
      
      // Performance Tracking
      PERFORMANCE: {
        HISTORY_LENGTH: 90,         // Days of performance history to keep
        CALCULATION_FREQUENCY: 'daily', // How often to calculate performance
        BENCHMARK_RATE: 0.06,       // 6% benchmark rate (market average)
        OUTPERFORMANCE_BONUS: 0.02  // 2% bonus for outperforming benchmark
      }
    }
  },

  // Shipping Route Coefficients
  SHIPPING: {
    // Address Types
    ADDRESS_TYPES: {
      SHIPPING: 'shipping',
      BILLING: 'billing',
      PICKUP: 'pickup',
      WAREHOUSE: 'warehouse'
    },
    
    // Shipping Methods
    SHIPPING_METHODS: {
      STANDARD: 'standard',
      EXPRESS: 'express',
      OVERNIGHT: 'overnight',
      PICKUP: 'pickup',
      SAME_DAY: 'same_day'
    },
    
    // Carriers
    CARRIERS: {
      FEDEX: 'fedex',
      UPS: 'ups',
      USPS: 'usps',
      DHL: 'dhl',
      LOCAL: 'local'
    },
    
    // Service Levels
    SERVICE_LEVELS: {
      GROUND: 'ground',
      TWO_DAY: '2day',
      OVERNIGHT: 'overnight',
      SAME_DAY: 'same_day'
    },
    
    // Cost Calculation
    COST_CALCULATION: {
      BASE_MULTIPLIER: 1.0,         // Base shipping cost multiplier
      FUEL_SURCHARGE_RATE: 0.15,    // 15% fuel surcharge
      INSURANCE_RATE: 0.02,         // 2% insurance rate
      HANDLING_FEE: 5.00,           // $5 handling fee
      SIGNATURE_FEE: 3.50,          // $3.50 signature required fee
      DISTANCE_RATE: 0.50           // $0.50 per mile for distance calculation
    },
    
    // Route Optimization
    ROUTE_OPTIMIZATION: {
      MAX_STOPS: 5,                 // Maximum intermediate stops
      OPTIMIZATION_ALGORITHM: 'nearest_neighbor', // Route optimization algorithm
      DISTANCE_LIMIT: 1000,         // Maximum route distance in miles
      TIME_LIMIT: 72                // Maximum route time in hours
    },
    
    // Tracking
    TRACKING: {
      UPDATE_FREQUENCY: 3600000,    // 1 hour in milliseconds
      MAX_RETRIES: 3,               // Maximum tracking update retries
      TIMEOUT: 30000                // 30 second timeout for tracking API calls
    }
  },

  // Amazon Integration Coefficients
  AMAZON: {
    // API Configuration
    API: {
      VERSION: '2013-08-01',
      MAX_RETRIES: 3,
      TIMEOUT: 30000,               // 30 seconds
      RATE_LIMIT: 100               // requests per minute
    },
    
    // Product Update Schedule
    UPDATE_SCHEDULE: {
      PRICE_UPDATES: '0 4 1 * *',   // 4:00 AM 1st of month
      PRODUCT_SYNC: '0 2 * * *'     // 2:00 AM daily
    },
    
    // Search Parameters
    SEARCH: {
      DEFAULT_LIMIT: 20,
      MAX_LIMIT: 100,
      DEFAULT_SORT: 'relevance',
      AVAILABLE_SORTS: ['relevance', 'price', 'rating', 'newest']
    }
  },

  // Drop Shipping Coefficients
  DROP_SHIPPING: {
    // Commission Structure
    COMMISSION: {
      CURATOR_SHARE: 0.15,          // 15% to curator
      PLATFORM_SHARE: 0.05,         // 5% to platform
      TOTAL_COMMISSION: 0.20        // 20% total commission
    },
    
    // List Management
    LIST_LIMITS: {
      MAX_PRODUCTS_PER_LIST: 100,
      MAX_LISTS_PER_USER: 10,
      MIN_PRODUCTS_FOR_PUBLISH: 5
    },
    
    // Analytics Schedule
    ANALYTICS_SCHEDULE: {
      WEEKLY: '0 6 * * 0'           // 6:00 AM Sundays
    }
  },

  // Waitlist Coefficients
  WAITLIST: {
    // Status Types
    STATUS: {
      PENDING: 'pending',
      APPROVED: 'approved',
      REJECTED: 'rejected',
      WHITELISTED: 'whitelisted'
    },
    
    // Processing Schedule
    PROCESSING_SCHEDULE: {
      DAILY_REVIEW: '0 9 * * *'     // 9:00 AM daily
    },
    
    // Limits
    LIMITS: {
      MAX_WAITLIST_SIZE: 10000,
      DAILY_APPROVAL_LIMIT: 100
    }
  },

  // User Account Coefficients
  USER: {
    // Account Status
    STATUS: {
      ACTIVE: 'active',
      INACTIVE: 'inactive',
      SUSPENDED: 'suspended',
      PENDING: 'pending'
    },
    
    // Verification
    VERIFICATION: {
      EMAIL_REQUIRED: true,
      PHONE_REQUIRED: false,
      DOCUMENT_VERIFICATION: false
    },
    
    // Limits
    LIMITS: {
      MAX_ACCOUNTS_PER_EMAIL: 1,
      MAX_ACCOUNTS_PER_PHONE: 1
    }
  },

  // System Coefficients
  SYSTEM: {
    // Pagination
    PAGINATION: {
      DEFAULT_PAGE_SIZE: 10,
      MAX_PAGE_SIZE: 100,
      MIN_PAGE_SIZE: 1
    },
    
    // Rate Limiting
    RATE_LIMIT: {
      WINDOW_MS: 15 * 60 * 1000,    // 15 minutes
      MAX_REQUESTS: 100,            // per window
      SKIP_SUCCESSFUL_REQUESTS: false
    },
    
    // File Upload
    FILE_UPLOAD: {
      MAX_SIZE: 10 * 1024 * 1024,   // 10MB
      ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
      MAX_FILES: 5
    },
    
    // Security
    SECURITY: {
      PASSWORD_MIN_LENGTH: 8,
      PASSWORD_REQUIRE_SPECIAL: true,
      SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours
      JWT_EXPIRY: '24h'
    }
  },

  // Notification Coefficients
  NOTIFICATIONS: {
    // Email Templates
    EMAIL_TEMPLATES: {
      WAITLIST_JOINED: {
        SUBJECT: 'Welcome to the Inventory Waitlist',
        BODY: 'Please accept our gratitude for waiting to be admitted to the Inventory.'
      },
      WAITLIST_APPROVED: {
        SUBJECT: 'Congratulations! Welcome to the Inventory',
        BODY: 'Congratulations! Welcome to the inventory. Happy sharing...'
      },
      WHITELIST_APPROVED: {
        SUBJECT: 'Welcome to the Inventory',
        BODY: 'Congratulations! Welcome to the inventory. Happy sharing...'
      },
      HOLD_CREATED: {
        SUBJECT: 'Hold Created Successfully',
        BODY: 'Your hold has been created. Investment returns will be calculated based on hold duration.'
      },
      HOLD_RELEASED: {
        SUBJECT: 'Hold Released - Disbursement Processed',
        BODY: 'Your hold has been released and disbursement has been processed.'
      }
    },
    
    // Delivery Methods
    DELIVERY_METHODS: {
      EMAIL: 'email',
      SMS: 'sms',
      PUSH: 'push',
      IN_APP: 'in_app'
    }
  },

  // Database Coefficients
  DATABASE: {
    // Connection
    CONNECTION: {
      MAX_POOL_SIZE: 20,
      MIN_POOL_SIZE: 5,
      CONNECTION_TIMEOUT: 30000,
      IDLE_TIMEOUT: 30000
    },
    
    // Migration
    MIGRATION: {
      AUTO_RUN: false,
      BACKUP_BEFORE_MIGRATION: true
    }
  },

  // Environment Coefficients
  ENVIRONMENT: {
    // Development
    DEVELOPMENT: {
      LOG_LEVEL: 'debug',
      ENABLE_DEBUG_MODE: true,
      ENABLE_TEST_DATA: true
    },
    
    // Production
    PRODUCTION: {
      LOG_LEVEL: 'info',
      ENABLE_DEBUG_MODE: false,
      ENABLE_TEST_DATA: false
    }
  }
};

// Helper function to get coefficient value with fallback
function getCoefficient(path, defaultValue = null) {
  const keys = path.split('.');
  let value = ConstantMarketCoefficients;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return defaultValue;
    }
  }
  
  return value;
}

// Helper function to set coefficient value
function setCoefficient(path, value) {
  const keys = path.split('.');
  const lastKey = keys.pop();
  let current = ConstantMarketCoefficients;
  
  for (const key of keys) {
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  
  current[lastKey] = value;
}

// Helper function to validate coefficient structure
function validateCoefficients() {
  const requiredPaths = [
    'REVENUE.CONSUMER_SHARE',
    'REVENUE.PLATFORM_SHARE',
    'REVENUE.HOLD_INVESTMENT.CONSUMER_CUT_DEFAULT',
    'HOLDS.REQUIREMENTS.SHIPPING_COST_MULTIPLIER',
    'WATER_LEVEL.BILL_CATEGORY_IMPACT.SERVER',
    'INVESTMENT.RETURN_RATES.DEFAULT',
    'SYSTEM.PAGINATION.DEFAULT_PAGE_SIZE'
  ];
  
  const errors = [];
  
  for (const path of requiredPaths) {
    if (getCoefficient(path) === null) {
      errors.push(`Missing required coefficient: ${path}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

module.exports = {
  ConstantMarketCoefficients,
  getCoefficient,
  setCoefficient,
  validateCoefficients
}; 