"use strict";
const { EntitySchema } = require("@mikro-orm/core");
const { BaseEntity } = require("./BaseEntity");

class Whitelist extends BaseEntity {
  constructor(email, firstName, lastName, phone = null, type = 'email') {
    super();
    this.email = email;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.type = type; // 'email', 'phone', 'domain', 'company'
    this.status = 'active'; // 'active', 'inactive'
    this.addedAt = new Date();
    this.addedBy = null; // Admin user ID who added to whitelist
    this.autoApprove = true; // Whether to auto-approve when matched
    this.metadata = {
      reason: '', // Reason for whitelisting
      source: 'admin', // 'admin', 'import', 'api'
      priority: 0, // Higher number = higher priority
      tags: [],
      notes: '',
      customFields: {}
    };
  }
}

const schema = new EntitySchema({
  class: Whitelist,
  extends: "BaseEntity",
  properties: {
    email: { type: "string", nullable: true },
    firstName: { type: "string", nullable: true },
    lastName: { type: "string", nullable: true },
    phone: { type: "string", nullable: true },
    type: { type: "string", default: "email" },
    status: { type: "string", default: "active" },
    addedAt: { type: "Date" },
    addedBy: { type: "number", nullable: true },
    autoApprove: { type: "boolean", default: true },
    metadata: { type: "json", default: {} },
  },
});

module.exports = {
  Whitelist,
  entity: Whitelist,
  schema,
  label: "whitelistRepository",
}; 