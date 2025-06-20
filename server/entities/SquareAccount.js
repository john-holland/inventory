"use strict";
const { EntitySchema } = require("@mikro-orm/core");
const { BaseEntity } = require("./BaseEntity");

class SquareAccount extends BaseEntity {
  constructor(userId, squareLocationId, squareAccessToken, refreshToken, status) {
    super();
    this.userId = userId; // Link to our platform user
    this.squareLocationId = squareLocationId; // Square location ID
    this.squareAccessToken = squareAccessToken; // OAuth access token
    this.refreshToken = refreshToken; // OAuth refresh token
    this.status = status; // 'active', 'inactive', 'suspended'
    this.lastSync = null; // Last time we synced with Square
    this.preferences = {
      autoSync: true,
      syncBills: true,
      syncPayments: true,
      syncInventory: true,
      notifications: true,
      billCategories: {
        server: ['server', 'hosting', 'cloud', 'infrastructure'],
        it: ['software', 'hardware', 'maintenance', 'support'],
        hr: ['payroll', 'benefits', 'training', 'recruitment']
      }
    };
    this.metadata = {
      businessName: '',
      businessType: '',
      currency: 'USD',
      timezone: 'UTC',
      lastBillSync: null,
      totalBills: 0,
      totalAmount: 0,
      billCategories: {
        server: { count: 0, amount: 0 },
        it: { count: 0, amount: 0 },
        hr: { count: 0, amount: 0 }
      }
    };
  }
}

const schema = new EntitySchema({
  class: SquareAccount,
  extends: "BaseEntity",
  properties: {
    userId: { type: "number" },
    squareLocationId: { type: "string" },
    squareAccessToken: { type: "string" },
    refreshToken: { type: "string" },
    status: { type: "string", default: "active" },
    lastSync: { type: "Date", nullable: true },
    preferences: { type: "json", default: {} },
    metadata: { type: "json", default: {} },
  },
});

module.exports = {
  SquareAccount,
  entity: SquareAccount,
  schema,
  label: "squareAccountRepository",
}; 