"use strict";
const { EntitySchema } = require("@mikro-orm/core");
const { BaseEntity } = require("./BaseEntity");

class Item extends BaseEntity {
  constructor(ownerId, title, description, category, condition, value, location, shippingMethod) {
    super();
    this.ownerId = ownerId;
    this.title = title;
    this.description = description;
    this.category = category;
    this.condition = condition;
    this.value = value;
    this.location = location;
    this.shippingMethod = shippingMethod;
    this.currentHolderId = null;
    this.holdAmount = 0;
    this.isAvailable = true;
    this.isShipped = false;
    this.shippingHistory = [];
    this.images = [];
    this.tags = [];
    this.estimatedShippingCost = 0;
    this.actualShippingCost = 0;
    this.weight = 0; // Weight in pounds (converted from user's preferred units)
    this.dimensions = ''; // Dimensions in inches (converted from user's preferred units)
    this.quantity = 1;
  }
}

const schema = new EntitySchema({
  class: Item,
  extends: "BaseEntity",
  properties: {
    ownerId: { type: "number" },
    title: { type: "string" },
    description: { type: "text" },
    category: { type: "string" },
    condition: { type: "string" },
    value: { type: "number" },
    location: { type: "json" },
    shippingMethod: { type: "string" }, // 'gas', 'flatrate', 'custom'
    currentHolderId: { type: "number", nullable: true },
    holdAmount: { type: "number", default: 0 },
    isAvailable: { type: "boolean", default: true },
    isShipped: { type: "boolean", default: false },
    shippingHistory: { type: "json", default: [] },
    images: { type: "json", default: [] },
    tags: { type: "json", default: [] },
    estimatedShippingCost: { type: "number", default: 0 },
    actualShippingCost: { type: "number", default: 0 },
    weight: { type: "number", default: 0 },
    dimensions: { type: "string", default: '' },
    quantity: { type: "number", default: 1 },
  },
});

module.exports = {
  Item,
  entity: Item,
  schema,
  label: "itemRepository",
}; 