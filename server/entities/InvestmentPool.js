"use strict";
const { EntitySchema } = require("@mikro-orm/core");
const { BaseEntity } = require("./BaseEntity");

class InvestmentPool extends BaseEntity {
  constructor(userId, poolType, initialAmount = 0) {
    super();
    this.userId = userId; // User who owns this pool
    this.poolType = poolType; // 'individual', 'herd', 'automatic'
    this.currentBalance = initialAmount; // Current balance in the pool
    this.totalInvested = 0; // Total amount ever invested
    this.totalReturns = 0; // Total returns earned
    this.isActive = true; // Whether this pool is active
    
    // Pool configuration
    this.targetBalance = 0; // Target balance for automatic mode
    this.minBalance = 0; // Minimum balance to maintain
    this.maxBalance = 0; // Maximum balance allowed
    this.autoReinvest = true; // Whether to automatically reinvest returns
    
    // Performance tracking
    this.averageReturnRate = 0; // Average return rate for this pool
    this.totalTransactions = 0; // Total number of transactions
    this.lastTransactionDate = null;
    this.performanceHistory = []; // Historical performance data
    
    // Herd-specific data
    this.herdParticipation = 0; // Percentage of user's investment in herd
    this.herdRank = 0; // User's rank in the herd
    this.herdContribution = 0; // Total contribution to herd
    
    // Automatic mode settings
    this.autoModeSettings = {
      enabled: false,
      herdThreshold: 0.7, // Switch to herd when water level is 70% or higher
      individualThreshold: 0.3, // Switch to individual when water level is 30% or lower
      rebalanceFrequency: 'daily', // How often to rebalance
      lastRebalance: null
    };
    
    this.metadata = {
      poolNotes: '',
      investmentStrategy: '',
      riskProfile: 'moderate', // 'conservative', 'moderate', 'aggressive'
      customFields: {},
      auditTrail: [] // Track all changes to the pool
    };
  }
}

const schema = new EntitySchema({
  class: InvestmentPool,
  extends: "BaseEntity",
  properties: {
    userId: { type: "number" },
    poolType: { type: "string" },
    currentBalance: { type: "decimal", precision: 10, scale: 2, default: 0 },
    totalInvested: { type: "decimal", precision: 10, scale: 2, default: 0 },
    totalReturns: { type: "decimal", precision: 10, scale: 2, default: 0 },
    isActive: { type: "boolean", default: true },
    targetBalance: { type: "decimal", precision: 10, scale: 2, default: 0 },
    minBalance: { type: "decimal", precision: 10, scale: 2, default: 0 },
    maxBalance: { type: "decimal", precision: 10, scale: 2, default: 0 },
    autoReinvest: { type: "boolean", default: true },
    averageReturnRate: { type: "decimal", precision: 5, scale: 4, default: 0 },
    totalTransactions: { type: "number", default: 0 },
    lastTransactionDate: { type: "Date", nullable: true },
    performanceHistory: { type: "json", default: [] },
    herdParticipation: { type: "decimal", precision: 5, scale: 4, default: 0 },
    herdRank: { type: "number", default: 0 },
    herdContribution: { type: "decimal", precision: 10, scale: 2, default: 0 },
    autoModeSettings: { type: "json", default: {} },
    metadata: { type: "json", default: {} },
  },
});

module.exports = {
  InvestmentPool,
  entity: InvestmentPool,
  schema,
  label: "investmentPoolRepository",
}; 