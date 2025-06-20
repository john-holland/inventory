"use strict";
const { EntitySchema } = require("@mikro-orm/core");
const { BaseEntity } = require("./BaseEntity");

class AmazonUser extends BaseEntity {
  constructor(userId, amazonUserId, amazonEmail, amazonAccessToken, refreshToken, status) {
    super();
    this.userId = userId; // Link to our platform user
    this.amazonUserId = amazonUserId; // Amazon's user ID
    this.amazonEmail = amazonEmail; // Amazon account email
    this.amazonAccessToken = amazonAccessToken; // OAuth access token
    this.refreshToken = refreshToken; // OAuth refresh token
    this.status = status; // 'active', 'inactive', 'suspended'
    this.lastSync = null; // Last time we synced with Amazon
    this.preferences = {
      autoSync: true,
      syncOrders: true,
      syncWishlist: true,
      syncAddresses: true,
      notifications: true
    };
    this.metadata = {
      amazonMarketplace: 'US', // Default marketplace
      primeMember: false,
      lastOrderSync: null,
      totalOrders: 0,
      totalSpent: 0
    };
  }
}

const schema = new EntitySchema({
  class: AmazonUser,
  extends: "BaseEntity",
  properties: {
    userId: { type: "number" },
    amazonUserId: { type: "string" },
    amazonEmail: { type: "string" },
    amazonAccessToken: { type: "string" },
    refreshToken: { type: "string" },
    status: { type: "string", default: "active" },
    lastSync: { type: "Date", nullable: true },
    preferences: { type: "json", default: {} },
    metadata: { type: "json", default: {} },
  },
});

module.exports = {
  AmazonUser,
  entity: AmazonUser,
  schema,
  label: "amazonUserRepository",
}; 