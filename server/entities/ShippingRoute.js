"use strict";
const { EntitySchema } = require("@mikro-orm/core");
const { BaseEntity } = require("./BaseEntity");

class ShippingRoute extends BaseEntity {
  constructor(itemId, fromUserId, toUserId, status, estimatedCost, actualCost) {
    super();
    this.itemId = itemId;
    this.fromUserId = fromUserId;
    this.toUserId = toUserId;
    this.status = status; // 'pending', 'in_transit', 'delivered', 'failed', 'cancelled'
    this.estimatedCost = estimatedCost;
    this.actualCost = actualCost;
    
    // Address associations
    this.fromAddressId = null; // UserAddress ID for origin
    this.toAddressId = null; // UserAddress ID for destination
    this.pickupAddressId = null; // UserAddress ID for pickup location
    this.dropoffAddressId = null; // UserAddress ID for dropoff location
    
    // Shipping details
    this.trackingNumber = null;
    this.shippingMethod = null; // 'standard', 'express', 'overnight', 'pickup'
    this.carrier = null; // 'fedex', 'ups', 'usps', 'dhl', 'local'
    this.serviceLevel = null; // 'ground', '2day', 'overnight', 'same_day'
    
    // Timing
    this.estimatedDeliveryDate = null;
    this.actualDeliveryDate = null;
    this.pickupDate = null;
    this.dropoffDate = null;
    
    // Route information
    this.route = []; // Array of intermediate stops with coordinates
    this.distance = 0; // Total distance in miles/kilometers
    this.duration = 0; // Estimated duration in hours
    
    // Cost breakdown
    this.costBreakdown = {
      baseShipping: 0,
      fuelSurcharge: 0,
      insurance: 0,
      handling: 0,
      taxes: 0,
      customs: 0,
      other: 0
    };
    
    // Status tracking
    this.statusHistory = []; // Array of status changes with timestamps
    this.currentLocation = null; // Current location coordinates
    this.lastUpdate = null; // Last tracking update
    
    // Special handling
    this.specialInstructions = '';
    this.signatureRequired = false;
    this.insuranceAmount = 0;
    this.declaredValue = 0;
    
    // Hold association
    this.holdId = null; // Associated hold for this shipping route
    
    this.notes = "";
    this.metadata = {
      routeOptimization: {},
      deliveryPreferences: {},
      restrictions: [],
      customFields: {},
      auditTrail: [] // Track all changes to the route
    };
  }
}

const schema = new EntitySchema({
  class: ShippingRoute,
  extends: "BaseEntity",
  properties: {
    itemId: { type: "number" },
    fromUserId: { type: "number" },
    toUserId: { type: "number" },
    status: { type: "string", default: "pending" },
    estimatedCost: { type: "decimal", precision: 10, scale: 2 },
    actualCost: { type: "decimal", precision: 10, scale: 2, nullable: true },
    fromAddressId: { type: "number", nullable: true },
    toAddressId: { type: "number", nullable: true },
    pickupAddressId: { type: "number", nullable: true },
    dropoffAddressId: { type: "number", nullable: true },
    trackingNumber: { type: "string", nullable: true },
    shippingMethod: { type: "string", nullable: true },
    carrier: { type: "string", nullable: true },
    serviceLevel: { type: "string", nullable: true },
    estimatedDeliveryDate: { type: "Date", nullable: true },
    actualDeliveryDate: { type: "Date", nullable: true },
    pickupDate: { type: "Date", nullable: true },
    dropoffDate: { type: "Date", nullable: true },
    route: { type: "json", default: [] },
    distance: { type: "decimal", precision: 10, scale: 2, default: 0 },
    duration: { type: "decimal", precision: 5, scale: 2, default: 0 },
    costBreakdown: { type: "json", default: {} },
    statusHistory: { type: "json", default: [] },
    currentLocation: { type: "json", nullable: true },
    lastUpdate: { type: "Date", nullable: true },
    specialInstructions: { type: "text", nullable: true },
    signatureRequired: { type: "boolean", default: false },
    insuranceAmount: { type: "decimal", precision: 10, scale: 2, default: 0 },
    declaredValue: { type: "decimal", precision: 10, scale: 2, default: 0 },
    holdId: { type: "number", nullable: true },
    notes: { type: "text", default: "" },
    metadata: { type: "json", default: {} },
  },
});

module.exports = {
  ShippingRoute,
  entity: ShippingRoute,
  schema,
  label: "shippingRouteRepository",
}; 