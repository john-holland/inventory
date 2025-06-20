"use strict";
const { EntitySchema } = require("@mikro-orm/core");
const { BaseEntity } = require("./BaseEntity");

class ListProduct extends BaseEntity {
  constructor(listId, productId, position, notes, status) {
    super();
    this.listId = listId; // Drop shipping list ID
    this.productId = productId; // Amazon product ID
    this.position = position; // Position in the list
    this.notes = notes; // Curator notes about the product
    this.status = status; // 'active', 'inactive', 'removed'
    this.featured = false; // Whether this product is featured in the list
    this.recommendedQuantity = 1; // Recommended quantity to purchase
    this.curatorRating = 0; // Curator's rating of the product
    this.curatorReview = ''; // Curator's review of the product
    this.purchaseCount = 0; // Number of times purchased from this list
    this.revenue = 0; // Revenue generated from this product
    this.metadata = {
      whyRecommended: '',
      bestFor: '',
      alternatives: [],
      priceAlert: null,
      lastChecked: null
    };
  }
}

const schema = new EntitySchema({
  class: ListProduct,
  extends: "BaseEntity",
  properties: {
    listId: { type: "number" },
    productId: { type: "number" },
    position: { type: "number" },
    notes: { type: "text", nullable: true },
    status: { type: "string", default: "active" },
    featured: { type: "boolean", default: false },
    recommendedQuantity: { type: "number", default: 1 },
    curatorRating: { type: "number", default: 0 },
    curatorReview: { type: "text", nullable: true },
    purchaseCount: { type: "number", default: 0 },
    revenue: { type: "number", default: 0 },
    metadata: { type: "json", default: {} },
  },
});

module.exports = {
  ListProduct,
  entity: ListProduct,
  schema,
  label: "listProductRepository",
}; 