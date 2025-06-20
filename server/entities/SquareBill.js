"use strict";
const { EntitySchema } = require("@mikro-orm/core");
const { BaseEntity } = require("./BaseEntity");

class SquareBill extends BaseEntity {
  constructor(squareAccountId, billId, amount, currency, category, description, billDate, status) {
    super();
    this.squareAccountId = squareAccountId; // Link to Square account
    this.billId = billId; // Square bill ID
    this.amount = amount; // Bill amount
    this.currency = currency; // Currency (USD, EUR, etc.)
    this.category = category; // 'server', 'it', 'hr', 'other'
    this.description = description; // Bill description
    this.billDate = billDate; // Date of the bill
    this.status = status; // 'pending', 'paid', 'overdue', 'cancelled'
    this.dueDate = null; // Due date for the bill
    this.paidDate = null; // Date when bill was paid
    this.paymentMethod = ''; // Method used to pay the bill
    this.vendor = ''; // Vendor/merchant name
    this.invoiceNumber = ''; // Invoice number
    this.tags = []; // Tags for categorization
    this.metadata = {
      squareLocationId: '',
      squareMerchantId: '',
      receiptUrl: '',
      notes: '',
      autoCategorized: false,
      waterLevelImpact: 0, // Amount that affects water level
      processedForWaterLevel: false
    };
  }
}

const schema = new EntitySchema({
  class: SquareBill,
  extends: "BaseEntity",
  properties: {
    squareAccountId: { type: "number" },
    billId: { type: "string" },
    amount: { type: "number" },
    currency: { type: "string", default: "USD" },
    category: { type: "string" },
    description: { type: "text" },
    billDate: { type: "Date" },
    status: { type: "string", default: "pending" },
    dueDate: { type: "Date", nullable: true },
    paidDate: { type: "Date", nullable: true },
    paymentMethod: { type: "string", nullable: true },
    vendor: { type: "string", nullable: true },
    invoiceNumber: { type: "string", nullable: true },
    tags: { type: "json", default: [] },
    metadata: { type: "json", default: {} },
  },
});

module.exports = {
  SquareBill,
  entity: SquareBill,
  schema,
  label: "squareBillRepository",
}; 