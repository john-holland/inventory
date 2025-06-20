"use strict";
const { EntitySchema } = require("@mikro-orm/core");
const { BaseEntity } = require("./BaseEntity");

class Release extends BaseEntity {
  constructor(itemId, userId, holdId = null, releaseType = 'manual') {
    super();
    this.itemId = itemId; // Item being released
    this.userId = userId; // User releasing the item
    this.holdId = holdId; // Associated hold (if any)
    this.releaseType = releaseType; // 'manual', 'automatic', 'expired', 'cancelled'
    this.releaseDate = new Date();
    this.releaseReason = '';
    this.amountReturned = 0; // Amount returned to user
    this.disbursementId = null; // Associated disbursement
    this.metadata = {
      releaseNotes: '',
      conditions: '', // Any conditions of release
      verification: '', // How release was verified
      tags: [],
      customFields: {},
      auditTrail: [] // Track all changes to the release
    };
  }
}

const schema = new EntitySchema({
  class: Release,
  extends: "BaseEntity",
  properties: {
    itemId: { type: "number" },
    userId: { type: "number" },
    holdId: { type: "number", nullable: true },
    releaseType: { type: "string", default: "manual" },
    releaseDate: { type: "Date" },
    releaseReason: { type: "text", nullable: true },
    amountReturned: { type: "decimal", precision: 10, scale: 2, default: 0 },
    disbursementId: { type: "number", nullable: true },
    metadata: { type: "json", default: {} },
  },
});

module.exports = {
  Release,
  entity: Release,
  schema,
  label: "releaseRepository",
}; 