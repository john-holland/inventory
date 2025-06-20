"use strict";
const { EntitySchema } = require("@mikro-orm/core");
const { BaseEntity } = require("./BaseEntity");

class Transaction extends BaseEntity {
  constructor(type, userId, itemId, amount, description, status) {
    super();
    this.type = type; // 'hold', 'shipping', 'service_fee', 'refund', 'purchase'
    this.userId = userId;
    this.itemId = itemId;
    this.amount = amount;
    this.description = description;
    this.status = status; // 'pending', 'completed', 'failed', 'cancelled'
    this.referenceId = null;
    this.metadata = {};
  }
}

const schema = new EntitySchema({
  class: Transaction,
  extends: "BaseEntity",
  properties: {
    type: { type: "string" },
    userId: { type: "number" },
    itemId: { type: "number", nullable: true },
    amount: { type: "number" },
    description: { type: "string" },
    status: { type: "string", default: "pending" },
    referenceId: { type: "string", nullable: true },
    metadata: { type: "json", default: {} },
  },
});

module.exports = {
  Transaction,
  entity: Transaction,
  schema,
  label: "transactionRepository",
}; 