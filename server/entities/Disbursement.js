"use strict";
const { EntitySchema } = require("@mikro-orm/core");
const { BaseEntity } = require("./BaseEntity");

class Disbursement extends BaseEntity {
  constructor(userId, amount, disbursementType, sourceId = null) {
    super();
    this.userId = userId; // User receiving the disbursement
    this.amount = amount; // Amount being disbursed
    this.disbursementType = disbursementType; // 'hold_release', 'investment_return', 'commission', 'refund'
    this.sourceId = sourceId; // ID of the source (hold, investment, etc.)
    this.status = 'pending'; // 'pending', 'processing', 'completed', 'failed', 'cancelled'
    this.requestDate = new Date();
    this.processedDate = null;
    this.completedDate = null;
    this.failedDate = null;
    this.paymentMethod = 'wallet'; // 'wallet', 'bank_transfer', 'paypal', 'crypto'
    this.transactionId = null; // External transaction ID
    this.metadata = {
      disbursementReason: '',
      sourceDetails: '', // Details about the source
      paymentDetails: {}, // Payment method specific details
      notes: '',
      tags: [],
      customFields: {},
      auditTrail: [] // Track all changes to the disbursement
    };
  }
}

const schema = new EntitySchema({
  class: Disbursement,
  extends: "BaseEntity",
  properties: {
    userId: { type: "number" },
    amount: { type: "decimal", precision: 10, scale: 2 },
    disbursementType: { type: "string" },
    sourceId: { type: "number", nullable: true },
    status: { type: "string", default: "pending" },
    requestDate: { type: "Date" },
    processedDate: { type: "Date", nullable: true },
    completedDate: { type: "Date", nullable: true },
    failedDate: { type: "Date", nullable: true },
    paymentMethod: { type: "string", default: "wallet" },
    transactionId: { type: "string", nullable: true },
    metadata: { type: "json", default: {} },
  },
});

module.exports = {
  Disbursement,
  entity: Disbursement,
  schema,
  label: "disbursementRepository",
}; 