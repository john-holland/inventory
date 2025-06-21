"use strict";
const { EntitySchema } = require("@mikro-orm/core");
const { BaseEntity } = require("./BaseEntity");

class eBayUser extends BaseEntity {
  constructor(eBayUserId, username, feedbackScore, positiveFeedbackPercentage) {
    super();
    this.eBayUserId = eBayUserId; // eBay User ID
    this.username = username; // eBay username
    this.feedbackScore = feedbackScore; // eBay feedback score
    this.positiveFeedbackPercentage = positiveFeedbackPercentage; // Positive feedback percentage
    this.topRatedSeller = false; // Whether user is a top-rated seller
    this.status = 'active'; // 'active', 'suspended', 'banned'
    this.registrationDate = new Date(); // When user registered on eBay
    this.lastActivity = new Date(); // Last activity date
    this.location = {}; // User location
    this.metadata = {
      totalSales: 0,
      totalPurchases: 0,
      averageRating: 0,
      responseTime: 0,
      shippingSpeed: 0
    };
  }
}

const schema = new EntitySchema({
  class: eBayUser,
  extends: "BaseEntity",
  properties: {
    eBayUserId: { type: "string" },
    username: { type: "string" },
    feedbackScore: { type: "number", default: 0 },
    positiveFeedbackPercentage: { type: "number", default: 0 },
    topRatedSeller: { type: "boolean", default: false },
    status: { type: "string", default: "active" },
    registrationDate: { type: "Date" },
    lastActivity: { type: "Date" },
    location: { type: "json", default: {} },
    metadata: { type: "json", default: {} },
  },
});

module.exports = {
  eBayUser,
  entity: eBayUser,
  schema,
  label: "eBayUserRepository",
}; 