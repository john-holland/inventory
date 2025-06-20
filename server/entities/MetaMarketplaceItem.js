"use strict";
const { EntitySchema } = require("@mikro-orm/core");
const { BaseEntity } = require("./BaseEntity");

class MetaMarketplaceItem extends BaseEntity {
  constructor(userId, title, description, price, category, status = 'active') {
    super();
    this.userId = userId; // User who created the item
    this.title = title;
    this.description = description;
    this.price = price;
    this.category = category;
    this.status = status; // 'active', 'inactive', 'sold', 'reserved'
    this.quantity = 1; // Available quantity
    this.condition = 'new'; // 'new', 'like_new', 'good', 'fair', 'poor'
    this.location = ''; // Physical location of the item
    this.shippingCost = 0; // Estimated shipping cost
    this.shippingMethod = 'standard'; // 'standard', 'express', 'pickup'
    this.images = []; // Array of image URLs
    this.tags = []; // Searchable tags
    this.amazonProductId = null; // Associated Amazon product (if any)
    this.dropShippingListId = null; // Associated drop shipping list (if any)
    this.metadata = {
      specifications: {}, // Item specifications
      dimensions: {}, // Physical dimensions
      weight: 0, // Weight in pounds
      brand: '',
      model: '',
      warranty: '',
      returnPolicy: '',
      sellerNotes: '',
      customFields: {},
      auditTrail: [] // Track all changes to the item
    };
  }
}

const schema = new EntitySchema({
  class: MetaMarketplaceItem,
  extends: "BaseEntity",
  properties: {
    userId: { type: "number" },
    title: { type: "string" },
    description: { type: "text" },
    price: { type: "decimal", precision: 10, scale: 2 },
    category: { type: "string" },
    status: { type: "string", default: "active" },
    quantity: { type: "number", default: 1 },
    condition: { type: "string", default: "new" },
    location: { type: "string", nullable: true },
    shippingCost: { type: "decimal", precision: 10, scale: 2, default: 0 },
    shippingMethod: { type: "string", default: "standard" },
    images: { type: "json", default: [] },
    tags: { type: "json", default: [] },
    amazonProductId: { type: "number", nullable: true },
    dropShippingListId: { type: "number", nullable: true },
    metadata: { type: "json", default: {} },
  },
});

module.exports = {
  MetaMarketplaceItem,
  entity: MetaMarketplaceItem,
  schema,
  label: "metaMarketplaceItemRepository",
}; 