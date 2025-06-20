"use strict";
const { EntitySchema } = require("@mikro-orm/core");
const { BaseEntity } = require("./BaseEntity");

class WaterLevelBill extends BaseEntity {
  constructor(waterLimitId, squareBillId, billCategory, amount, adjustmentType, description) {
    super();
    this.waterLimitId = waterLimitId; // Link to water limit
    this.squareBillId = squareBillId; // Link to Square bill
    this.billCategory = billCategory; // 'server', 'it', 'hr'
    this.amount = amount; // Amount that affects water level
    this.adjustmentType = adjustmentType; // 'increase', 'decrease', 'threshold_adjustment'
    this.description = description; // Description of the adjustment
    this.effectiveDate = new Date(); // When the adjustment takes effect
    this.processed = false; // Whether the adjustment has been processed
    this.processedDate = null; // Date when adjustment was processed
    this.metadata = {
      originalThreshold: 0, // Original water limit threshold
      newThreshold: 0, // New threshold after adjustment
      billDetails: {}, // Details from the Square bill
      adjustmentReason: '', // Reason for the adjustment
      monthlyAverage: 0, // Monthly average for this category
      seasonalFactor: 1.0 // Seasonal adjustment factor
    };
  }
}

const schema = new EntitySchema({
  class: WaterLevelBill,
  extends: "BaseEntity",
  properties: {
    waterLimitId: { type: "number" },
    squareBillId: { type: "number" },
    billCategory: { type: "string" },
    amount: { type: "number" },
    adjustmentType: { type: "string" },
    description: { type: "text" },
    effectiveDate: { type: "Date" },
    processed: { type: "boolean", default: false },
    processedDate: { type: "Date", nullable: true },
    metadata: { type: "json", default: {} },
  },
});

module.exports = {
  WaterLevelBill,
  entity: WaterLevelBill,
  schema,
  label: "waterLevelBillRepository",
}; 