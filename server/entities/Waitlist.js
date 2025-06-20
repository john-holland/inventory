"use strict";
const { EntitySchema } = require("@mikro-orm/core");
const { BaseEntity } = require("./BaseEntity");

class Waitlist extends BaseEntity {
  constructor(email, firstName, lastName, phone = null, status = 'pending') {
    super();
    this.email = email;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.status = status; // 'pending', 'approved', 'rejected', 'whitelisted'
    this.appliedAt = new Date();
    this.approvedAt = null;
    this.rejectedAt = null;
    this.approvedBy = null; // Admin user ID who approved
    this.rejectedBy = null; // Admin user ID who rejected
    this.rejectionReason = null;
    this.userId = null; // Link to User entity when approved
    this.metadata = {
      source: 'web_form', // 'web_form', 'admin_add', 'whitelist'
      ipAddress: null,
      userAgent: null,
      referrer: null,
      notes: '',
      priority: 0, // Higher number = higher priority
      tags: [],
      customFields: {}
    };
  }
}

const schema = new EntitySchema({
  class: Waitlist,
  extends: "BaseEntity",
  properties: {
    email: { type: "string", unique: true },
    firstName: { type: "string" },
    lastName: { type: "string" },
    phone: { type: "string", nullable: true },
    status: { type: "string", default: "pending" },
    appliedAt: { type: "Date" },
    approvedAt: { type: "Date", nullable: true },
    rejectedAt: { type: "Date", nullable: true },
    approvedBy: { type: "number", nullable: true },
    rejectedBy: { type: "number", nullable: true },
    rejectionReason: { type: "text", nullable: true },
    userId: { type: "number", nullable: true },
    metadata: { type: "json", default: {} },
  },
});

module.exports = {
  Waitlist,
  entity: Waitlist,
  schema,
  label: "waitlistRepository",
}; 