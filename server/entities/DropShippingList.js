"use strict";
const { EntitySchema } = require("@mikro-orm/core");
const { BaseEntity } = require("./BaseEntity");

class DropShippingList extends BaseEntity {
  constructor(creatorId, title, description, category, status, visibility) {
    super();
    this.creatorId = creatorId; // User who created the list
    this.title = title; // List title
    this.description = description; // List description
    this.category = category; // Product category
    this.status = status; // 'active', 'inactive', 'archived'
    this.visibility = visibility; // 'public', 'private', 'curated'
    this.featured = false; // Whether this is a featured list
    this.rating = 0; // Average rating
    this.ratingCount = 0; // Number of ratings
    this.viewCount = 0; // Number of views
    this.purchaseCount = 0; // Number of purchases from this list
    this.totalRevenue = 0; // Total revenue generated
    this.tags = []; // Tags for categorization
    this.metadata = {
      targetAudience: '',
      priceRange: { min: 0, max: 0 },
      estimatedShipping: 0,
      averageRating: 0,
      totalProducts: 0,
      lastUpdated: null
    };
  }
}

const schema = new EntitySchema({
  class: DropShippingList,
  extends: "BaseEntity",
  properties: {
    creatorId: { type: "number" },
    title: { type: "string" },
    description: { type: "text" },
    category: { type: "string" },
    status: { type: "string", default: "active" },
    visibility: { type: "string", default: "public" },
    featured: { type: "boolean", default: false },
    rating: { type: "number", default: 0 },
    ratingCount: { type: "number", default: 0 },
    viewCount: { type: "number", default: 0 },
    purchaseCount: { type: "number", default: 0 },
    totalRevenue: { type: "number", default: 0 },
    tags: { type: "json", default: [] },
    metadata: { type: "json", default: {} },
  },
});

module.exports = {
  DropShippingList,
  entity: DropShippingList,
  schema,
  label: "dropShippingListRepository",
}; 