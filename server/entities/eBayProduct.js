"use strict";
const { EntitySchema } = require("@mikro-orm/core");
const { BaseEntity } = require("./BaseEntity");

class eBayProduct extends BaseEntity {
  constructor(itemId, title, description, category, price, currency, condition) {
    super();
    this.itemId = itemId; // eBay Item ID
    this.title = title; // Product title
    this.description = description; // Product description
    this.category = category; // Product category
    this.price = price; // Current price
    this.currency = currency; // Currency (USD, EUR, etc.)
    this.condition = condition; // 'New', 'Used', 'For parts or not working'
    this.status = 'active'; // 'active', 'inactive', 'ended', 'sold'
    this.originalPrice = price; // Original price for tracking changes
    this.discountPercentage = 0; // Current discount percentage
    this.rating = 0; // eBay rating
    this.ratingCount = 0; // Number of ratings
    this.availability = 'in_stock'; // 'in_stock', 'limited', 'out_of_stock'
    this.freeShipping = false; // Whether product has free shipping
    this.shippingCost = 0; // Shipping cost
    this.endTime = null; // Auction end time
    this.bidCount = 0; // Number of bids (for auctions)
    this.watchCount = 0; // Number of watchers
    this.listingType = 'FIXED_PRICE'; // 'FIXED_PRICE', 'AUCTION', 'BEST_OFFER'
    this.shippingWeight = 0; // Product weight for shipping calculations
    this.dimensions = {
      length: 0,
      width: 0,
      height: 0,
      unit: 'inches'
    };
    this.images = []; // Product images URLs
    this.seller = {}; // Seller information
    this.location = {}; // Item location
    this.specifications = {}; // Product specifications
    this.url = ''; // eBay item URL
    this.metadata = {
      lastPriceUpdate: null,
      priceHistory: [],
      inventoryLevel: 0,
      sellerInfo: {},
      marketplace: 'EBAY-US'
    };
  }
}

const schema = new EntitySchema({
  class: eBayProduct,
  extends: "BaseEntity",
  properties: {
    itemId: { type: "string" },
    title: { type: "string" },
    description: { type: "text" },
    category: { type: "string" },
    price: { type: "number" },
    currency: { type: "string", default: "USD" },
    condition: { type: "string", default: "Used" },
    status: { type: "string", default: "active" },
    originalPrice: { type: "number" },
    discountPercentage: { type: "number", default: 0 },
    rating: { type: "number", default: 0 },
    ratingCount: { type: "number", default: 0 },
    availability: { type: "string", default: "in_stock" },
    freeShipping: { type: "boolean", default: false },
    shippingCost: { type: "number", default: 0 },
    endTime: { type: "Date", nullable: true },
    bidCount: { type: "number", default: 0 },
    watchCount: { type: "number", default: 0 },
    listingType: { type: "string", default: "FIXED_PRICE" },
    shippingWeight: { type: "number", default: 0 },
    dimensions: { type: "json", default: {} },
    images: { type: "json", default: [] },
    seller: { type: "json", default: {} },
    location: { type: "json", default: {} },
    specifications: { type: "json", default: {} },
    url: { type: "string", default: "" },
    metadata: { type: "json", default: {} },
  },
});

module.exports = {
  eBayProduct,
  entity: eBayProduct,
  schema,
  label: "eBayProductRepository",
}; 