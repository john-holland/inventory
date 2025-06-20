"use strict";
const { EntitySchema } = require("@mikro-orm/core");
const { BaseEntity } = require("./BaseEntity");

class UserAddress extends BaseEntity {
  constructor(userId, addressType, addressData) {
    super();
    this.userId = userId; // User who owns this address
    this.addressType = addressType; // 'shipping', 'billing', 'pickup', 'warehouse'
    this.isDefault = false; // Whether this is the default address for this type
    this.isActive = true; // Whether this address is active
    
    // Address data
    this.streetAddress1 = addressData.streetAddress1 || '';
    this.streetAddress2 = addressData.streetAddress2 || '';
    this.city = addressData.city || '';
    this.state = addressData.state || '';
    this.postalCode = addressData.postalCode || '';
    this.country = addressData.country || 'US';
    this.phone = addressData.phone || '';
    this.contactName = addressData.contactName || '';
    
    // Shipping-specific data
    this.shippingInstructions = addressData.shippingInstructions || '';
    this.accessCode = addressData.accessCode || '';
    this.businessHours = addressData.businessHours || '';
    this.specialRequirements = addressData.specialRequirements || '';
    
    // Validation and verification
    this.isVerified = false; // Whether this address has been verified
    this.verificationDate = null;
    this.verificationMethod = ''; // 'manual', 'api', 'postal_service'
    
    this.metadata = {
      addressNotes: '',
      deliveryPreferences: {},
      restrictions: [],
      customFields: {},
      auditTrail: [] // Track all changes to the address
    };
  }
}

const schema = new EntitySchema({
  class: UserAddress,
  extends: "BaseEntity",
  properties: {
    userId: { type: "number" },
    addressType: { type: "string" },
    isDefault: { type: "boolean", default: false },
    isActive: { type: "boolean", default: true },
    streetAddress1: { type: "string" },
    streetAddress2: { type: "string", nullable: true },
    city: { type: "string" },
    state: { type: "string" },
    postalCode: { type: "string" },
    country: { type: "string", default: "US" },
    phone: { type: "string", nullable: true },
    contactName: { type: "string", nullable: true },
    shippingInstructions: { type: "text", nullable: true },
    accessCode: { type: "string", nullable: true },
    businessHours: { type: "string", nullable: true },
    specialRequirements: { type: "text", nullable: true },
    isVerified: { type: "boolean", default: false },
    verificationDate: { type: "Date", nullable: true },
    verificationMethod: { type: "string", nullable: true },
    metadata: { type: "json", default: {} },
  },
});

module.exports = {
  UserAddress,
  entity: UserAddress,
  schema,
  label: "userAddressRepository",
}; 