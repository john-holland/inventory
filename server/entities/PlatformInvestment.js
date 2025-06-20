"use strict";
const { EntitySchema } = require("@mikro-orm/core");
const { BaseEntity } = require("./BaseEntity");

class PlatformInvestment extends BaseEntity {
  constructor(totalInvestedAmount, activeHoldCount, status) {
    super();
    this.totalInvestedAmount = totalInvestedAmount; // Total platform investment (50% of all holds)
    this.activeHoldCount = activeHoldCount; // Number of active holds
    this.status = status; // 'active', 'distributing', 'completed'
    this.currentValue = 0; // Current value of platform investment
    this.totalReturnAmount = 0; // Total return from platform investment
    this.distributedAmount = 0; // Amount distributed to consumers
    this.undistributedAmount = 0; // Amount not yet distributed
    this.lastDistributionDate = null; // Last time returns were distributed
    this.distributionStrategy = 'equal_share'; // How returns are distributed
    this.metadata = {
      investmentTypes: [],
      averageReturnRate: 0,
      distributionHistory: []
    };
  }
}

const schema = new EntitySchema({
  class: PlatformInvestment,
  extends: "BaseEntity",
  properties: {
    totalInvestedAmount: { type: "number" },
    activeHoldCount: { type: "number", default: 0 },
    status: { type: "string", default: "active" },
    currentValue: { type: "number", default: 0 },
    totalReturnAmount: { type: "number", default: 0 },
    distributedAmount: { type: "number", default: 0 },
    undistributedAmount: { type: "number", default: 0 },
    lastDistributionDate: { type: "Date", nullable: true },
    distributionStrategy: { type: "string", default: "equal_share" },
    metadata: { type: "json", default: {} },
  },
});

module.exports = {
  PlatformInvestment,
  entity: PlatformInvestment,
  schema,
  label: "platformInvestmentRepository",
}; 