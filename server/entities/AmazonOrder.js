"use strict";
const { EntitySchema } = require("@mikro-orm/core");
const { BaseEntity } = require("./BaseEntity");

class AmazonOrder extends BaseEntity {
  constructor(userId, amazonOrderId, productId, listId, quantity, totalAmount, status) {
    super();
    this.userId = userId; // Our platform user ID
    this.amazonOrderId = amazonOrderId; // Amazon's order ID
    this.productId = productId; // Amazon product ID
    this.listId = listId; // Drop shipping list ID (if applicable)
    this.quantity = quantity; // Quantity ordered
    this.totalAmount = totalAmount; // Total amount paid
    this.status = status; // 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'
    this.orderDate = new Date(); // When the order was placed
    this.estimatedDelivery = null; // Estimated delivery date
    this.actualDelivery = null; // Actual delivery date
    this.shippingAddress = {}; // Shipping address
    this.billingAddress = {}; // Billing address
    this.shippingMethod = ''; // Shipping method used
    this.trackingNumber = ''; // Tracking number
    this.trackingUrl = ''; // Tracking URL
    this.primeEligible = false; // Whether order was Prime eligible
    this.freeShipping = false; // Whether shipping was free
    this.shippingCost = 0; // Shipping cost
    this.taxAmount = 0; // Tax amount
    this.discountAmount = 0; // Discount amount
    this.subtotal = 0; // Subtotal before tax and shipping
    this.currency = 'USD'; // Currency
    this.metadata = {
      amazonMarketplace: 'US',
      orderSource: 'drop_shipping_list', // 'drop_shipping_list', 'direct_search', 'recommendation'
      affiliateCommission: 0,
      platformCommission: 0,
      customerNotes: '',
      orderNotes: ''
    };
  }
}

const schema = new EntitySchema({
  class: AmazonOrder,
  extends: "BaseEntity",
  properties: {
    userId: { type: "number" },
    amazonOrderId: { type: "string" },
    productId: { type: "number" },
    listId: { type: "number", nullable: true },
    quantity: { type: "number" },
    totalAmount: { type: "number" },
    status: { type: "string", default: "pending" },
    orderDate: { type: "Date" },
    estimatedDelivery: { type: "Date", nullable: true },
    actualDelivery: { type: "Date", nullable: true },
    shippingAddress: { type: "json", default: {} },
    billingAddress: { type: "json", default: {} },
    shippingMethod: { type: "string", nullable: true },
    trackingNumber: { type: "string", nullable: true },
    trackingUrl: { type: "string", nullable: true },
    primeEligible: { type: "boolean", default: false },
    freeShipping: { type: "boolean", default: false },
    shippingCost: { type: "number", default: 0 },
    taxAmount: { type: "number", default: 0 },
    discountAmount: { type: "number", default: 0 },
    subtotal: { type: "number", default: 0 },
    currency: { type: "string", default: "USD" },
    metadata: { type: "json", default: {} },
  },
});

module.exports = {
  AmazonOrder,
  entity: AmazonOrder,
  schema,
  label: "amazonOrderRepository",
}; 