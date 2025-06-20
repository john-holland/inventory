"use strict";
const { EntitySchema } = require("@mikro-orm/core");
const { BaseEntity } = require("./BaseEntity");

class ConsumerInvestment extends BaseEntity {
  constructor(userId, itemId, holdAmount, consumerInvestmentAmount, platformInvestmentAmount, status) {
    super();
    this.userId = userId;
    this.itemId = itemId;
    this.holdAmount = holdAmount; // Total hold amount (2x shipping cost)
    this.consumerInvestmentAmount = consumerInvestmentAmount; // Consumer's direct investment (50% of hold)
    this.platformInvestmentAmount = platformInvestmentAmount; // Platform's investment (50% of hold)
    this.status = status; // 'active', 'completed', 'cancelled'
    this.currentValue = 0; // Current value of the investment
    this.returnRate = 0; // Percentage return on investment
    this.consumerReturnAmount = 0; // Amount returned to consumer
    this.platformReturnAmount = 0; // Amount returned to platform
    this.sharedReturnAmount = 0; // Amount from platform investment shared among all consumers
    this.investmentType = 'hold_investment'; // Type of investment
    this.metadata = {
      itemTitle: '',
      itemCategory: '',
      holdDuration: 0,
      investmentStrategy: 'hold_based'
    };
  }
}

const schema = new EntitySchema({
  class: ConsumerInvestment,
  extends: "BaseEntity",
  properties: {
    userId: { type: "number" },
    itemId: { type: "number" },
    holdAmount: { type: "number" },
    consumerInvestmentAmount: { type: "number" },
    platformInvestmentAmount: { type: "number" },
    status: { type: "string", default: "active" },
    currentValue: { type: "number", default: 0 },
    returnRate: { type: "number", default: 0 },
    consumerReturnAmount: { type: "number", default: 0 },
    platformReturnAmount: { type: "number", default: 0 },
    sharedReturnAmount: { type: "number", default: 0 },
    investmentType: { type: "string", default: "hold_investment" },
    metadata: { type: "json", default: {} },
  },
});

module.exports = {
  ConsumerInvestment,
  entity: ConsumerInvestment,
  schema,
  label: "consumerInvestmentRepository",
}; 