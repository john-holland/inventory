"use strict";
const { EntitySchema } = require("@mikro-orm/core");
const { BaseEntity } = require("./BaseEntity");

class AmazonProduct extends BaseEntity {
  constructor(amazonAsin, title, description, category, price, currency, status) {
    super();
    this.amazonAsin = amazonAsin; // Amazon Standard Identification Number
    this.title = title; // Product title
    this.description = description; // Product description
    this.category = category; // Product category
    this.price = price; // Current price
    this.currency = currency; // Currency (USD, EUR, etc.)
    this.status = status; // 'active', 'inactive', 'unavailable'
    this.originalPrice = price; // Original price for tracking changes
    this.discountPercentage = 0; // Current discount percentage
    this.rating = 0; // Amazon rating
    this.ratingCount = 0; // Number of ratings
    this.availability = 'in_stock'; // 'in_stock', 'limited', 'out_of_stock'
    this.primeEligible = false; // Whether product is Prime eligible
    this.freeShipping = false; // Whether product has free shipping
    this.estimatedDelivery = null; // Estimated delivery date
    this.shippingWeight = 0; // Product weight for shipping calculations
    this.dimensions = {
      length: 0,
      width: 0,
      height: 0,
      unit: 'inches'
    };
    this.images = []; // Product images URLs
    this.features = []; // Product features
    this.specifications = {}; // Product specifications
    this.metadata = {
      lastPriceUpdate: null,
      priceHistory: [],
      inventoryLevel: 0,
      sellerInfo: {},
      marketplace: 'US'
    };
  }
}

const schema = new EntitySchema({
  class: AmazonProduct,
  extends: "BaseEntity",
  properties: {
    amazonAsin: { type: "string" },
    title: { type: "string" },
    description: { type: "text" },
    category: { type: "string" },
    price: { type: "number" },
    currency: { type: "string", default: "USD" },
    status: { type: "string", default: "active" },
    originalPrice: { type: "number" },
    discountPercentage: { type: "number", default: 0 },
    rating: { type: "number", default: 0 },
    ratingCount: { type: "number", default: 0 },
    availability: { type: "string", default: "in_stock" },
    primeEligible: { type: "boolean", default: false },
    freeShipping: { type: "boolean", default: false },
    estimatedDelivery: { type: "Date", nullable: true },
    shippingWeight: { type: "number", default: 0 },
    dimensions: { type: "json", default: {} },
    images: { type: "json", default: [] },
    features: { type: "json", default: [] },
    specifications: { type: "json", default: {} },
    metadata: { type: "json", default: {} },
  },
});

module.exports = {
  AmazonProduct,
  entity: AmazonProduct,
  schema,
  label: "amazonProductRepository",
}; 