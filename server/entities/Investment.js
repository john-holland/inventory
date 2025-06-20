"use strict";
const { EntitySchema } = require("@mikro-orm/core");
const { BaseEntity } = require("./BaseEntity");

class Investment extends BaseEntity {
  constructor(userId, amount, investmentType, service, status) {
    super();
    this.userId = userId;
    this.amount = amount;
    this.investmentType = investmentType; // 'crypto', 'stocks', 'bonds', 'real_estate'
    this.service = service; // 'robinhood', 'coinbase', 'vanguard', etc.
    this.status = status; // 'active', 'completed', 'failed', 'cancelled'
    this.returnRate = 0;
    this.currentValue = amount;
    this.lastUpdated = new Date();
    this.metadata = {};
  }
}

const schema = new EntitySchema({
  class: Investment,
  extends: "BaseEntity",
  properties: {
    userId: { type: "number" },
    amount: { type: "number" },
    investmentType: { type: "string" },
    service: { type: "string" },
    status: { type: "string", default: "active" },
    returnRate: { type: "number", default: 0 },
    currentValue: { type: "number" },
    lastUpdated: { type: "Date" },
    metadata: { type: "json", default: {} },
  },
});

module.exports = {
  Investment,
  entity: Investment,
  schema,
  label: "investmentRepository",
}; 