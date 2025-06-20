const { EntitySchema } = require("@mikro-orm/core");

class Dispute {
  constructor(holdId, initiatedBy, disputeType, description, status = 'open') {
    this.holdId = holdId;
    this.initiatedBy = initiatedBy;
    this.disputeType = disputeType; // 'condition', 'damage', 'missing', 'other'
    this.description = description;
    this.status = status; // 'open', 'under_review', 'resolved', 'closed'
    this.resolvedBy = null;
    this.resolvedAt = null;
    this.resolution = null;
    this.moderationNotes = null;
    
    // Moderation actions
    this.holdReleaseOrdered = false; // Whether hold was ordered to be released
    this.shipmentLabelCreated = false; // Whether return shipment label was created
    this.banLevel = null; // 'no-buy', 'no-list', 'hide', 'ip-ban', 'email-ban', 'unlist'
    this.bannedUserId = null; // User ID of banned user
    this.banReason = null; // Reason for the ban
    this.banExpiryDate = null; // When ban expires (null = permanent)
    this.disbursementInfo = null; // Information for fund disbursement
    
    // Moderation metadata
    this.moderationActions = []; // Array of actions taken by moderators
    this.evidenceReviewed = []; // Array of evidence reviewed
    this.partiesContacted = []; // Array of parties contacted during resolution
    
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}

const schema = new EntitySchema({
  class: Dispute,
  tableName: 'disputes',
  properties: {
    id: { primary: true, type: 'uuid' },
    holdId: { type: 'uuid', nullable: false },
    initiatedBy: { type: 'uuid', nullable: false },
    disputeType: { type: 'string', length: 20, nullable: false },
    description: { type: 'text', nullable: false },
    status: { type: 'string', length: 20, nullable: false },
    resolvedBy: { type: 'uuid', nullable: true },
    resolvedAt: { type: 'datetime', nullable: true },
    resolution: { type: 'text', nullable: true },
    moderationNotes: { type: 'text', nullable: true },
    holdReleaseOrdered: { type: 'boolean', default: false },
    shipmentLabelCreated: { type: 'boolean', default: false },
    banLevel: { type: 'string', length: 20, nullable: true },
    bannedUserId: { type: 'uuid', nullable: true },
    banReason: { type: 'text', nullable: true },
    banExpiryDate: { type: 'datetime', nullable: true },
    disbursementInfo: { type: 'json', nullable: true },
    moderationActions: { type: 'json', default: [] },
    evidenceReviewed: { type: 'json', default: [] },
    partiesContacted: { type: 'json', default: [] },
    createdAt: { type: 'datetime', nullable: false },
    updatedAt: { type: 'datetime', nullable: false }
  },
  indexes: [
    { properties: ['holdId'] },
    { properties: ['initiatedBy'] },
    { properties: ['disputeType'] },
    { properties: ['status'] },
    { properties: ['resolvedBy'] },
    { properties: ['bannedUserId'] },
    { properties: ['banLevel'] },
    { properties: ['createdAt'] }
  ]
});

module.exports = { Dispute, schema }; 