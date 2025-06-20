"use strict";
const { EntitySchema } = require("@mikro-orm/core");
const { BaseEntity } = require("./BaseEntity");

class Hold extends BaseEntity {
  constructor(userId, itemId, shippingRouteId, amount, status = 'active') {
    super();
    this.userId = userId; // User holding the item
    this.itemId = itemId; // Item being held
    this.shippingRouteId = shippingRouteId; // Where the item is going
    this.amount = amount; // Amount held back (2x shipping cost)
    this.status = status; // 'active', 'released', 'cancelled', 'expired'
    this.holdDate = new Date();
    this.releaseDate = null;
    this.cancelledDate = null;
    this.expiryDate = null;
    this.consumerInvestmentId = null; // Associated consumer investment
    
    // Investment pool association
    this.investmentPoolId = null; // Associated investment pool
    this.investmentType = 'individual'; // 'individual', 'herd', 'automatic'
    this.investmentAmount = amount; // Amount invested from the pool
    this.expectedReturnRate = 0; // Expected return rate for this hold
    this.actualReturnRate = 0; // Actual return rate achieved
    
    // Herd investment specific
    this.herdContribution = 0; // Amount contributed to herd
    this.herdReturnShare = 0; // Share of herd returns
    this.herdRank = 0; // Rank in herd for this hold
    
    // Water level integration
    this.waterLevelImpact = 0; // Impact on water level
    this.waterLevelThreshold = 0; // Threshold for herd requirement
    this.requiresHerdInvestment = false; // Whether herd investment is required
    
    // Enhanced metadata
    this.metadata = {
      holdReason: '', // Why the hold was placed
      releaseReason: '', // Why the hold was released
      cancellationReason: '', // Why the hold was cancelled
      notes: '',
      priority: 0, // Higher number = higher priority
      tags: [],
      investmentStrategy: '', // Investment strategy used
      riskAssessment: '', // Risk assessment for this hold
      marketConditions: {}, // Market conditions at time of hold
      customFields: {},
      auditTrail: [] // Track all changes to the hold
    };
  }
}

const schema = new EntitySchema({
  class: Hold,
  extends: "BaseEntity",
  properties: {
    userId: { type: "number" },
    itemId: { type: "number" },
    shippingRouteId: { type: "number", nullable: true },
    amount: { type: "decimal", precision: 10, scale: 2 },
    status: { type: "string", default: "active" },
    holdDate: { type: "Date" },
    releaseDate: { type: "Date", nullable: true },
    cancelledDate: { type: "Date", nullable: true },
    expiryDate: { type: "Date", nullable: true },
    consumerInvestmentId: { type: "number", nullable: true },
    investmentPoolId: { type: "number", nullable: true },
    investmentType: { type: "string", default: "individual" },
    investmentAmount: { type: "decimal", precision: 10, scale: 2, default: 0 },
    expectedReturnRate: { type: "decimal", precision: 5, scale: 4, default: 0 },
    actualReturnRate: { type: "decimal", precision: 5, scale: 4, default: 0 },
    herdContribution: { type: "decimal", precision: 10, scale: 2, default: 0 },
    herdReturnShare: { type: "decimal", precision: 5, scale: 4, default: 0 },
    herdRank: { type: "number", default: 0 },
    waterLevelImpact: { type: "decimal", precision: 5, scale: 4, default: 0 },
    waterLevelThreshold: { type: "decimal", precision: 5, scale: 4, default: 0 },
    requiresHerdInvestment: { type: "boolean", default: false },
    metadata: { type: "json", default: {} },
  },
});

module.exports = {
  Hold,
  entity: Hold,
  schema,
  label: "holdRepository",
}; 