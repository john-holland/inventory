"use strict";
const { EntitySchema } = require("@mikro-orm/core");
const { BaseEntity } = require("./BaseEntity");

class WaterLimit extends BaseEntity {
  constructor(userId, investmentId, amount, type, status) {
    super();
    this.userId = userId;
    this.investmentId = investmentId;
    this.amount = amount;
    this.type = type; // 'investment_return', 'hold_stagnation', 'energy_efficiency'
    this.status = status; // 'pending', 'released', 'cancelled'
    this.releaseThreshold = 0; // Amount that must be reached before release
    this.currentBalance = 0; // Current amount in water limit
    this.lastUpdated = new Date();
    this.releaseDate = null; // When the water limit can be released
    this.metadata = {};
  }
}

const schema = new EntitySchema({
  class: WaterLimit,
  extends: "BaseEntity",
  properties: {
    userId: { type: "number" },
    investmentId: { type: "number", nullable: true },
    amount: { type: "number" },
    type: { type: "string" },
    status: { type: "string", default: "pending" },
    releaseThreshold: { type: "number", default: 0 },
    currentBalance: { type: "number", default: 0 },
    lastUpdated: { type: "Date" },
    releaseDate: { type: "Date", nullable: true },
    metadata: { type: "json", default: {} },
  },
});

module.exports = {
  WaterLimit,
  entity: WaterLimit,
  schema,
  label: "waterLimitRepository",
}; 