"use strict";
const { EntitySchema } = require("@mikro-orm/core");

const BanRequest = {
  name: 'BanRequest',
  tableName: 'ban_requests',
  properties: {
    id: { primary: true, type: 'uuid' },
    type: { 
      type: 'enum', 
      values: ['ban_request', 'ban_repeal'], 
      default: 'ban_request' 
    },
    targetUserId: { type: 'uuid' },
    targetUsername: { type: 'string', length: 50 },
    requestedBy: { type: 'uuid' }, // CSR user ID
    requestedByUsername: { type: 'string', length: 50 },
    banLevel: { 
      type: 'enum', 
      values: ['chat_ban', 'list_ban', 'permanent'], 
      default: 'chat_ban' 
    },
    reason: { type: 'text' },
    evidence: { type: 'json', nullable: true }, // Screenshots, chat logs, etc.
    status: { 
      type: 'enum', 
      values: ['pending', 'approved', 'rejected', 'expired'], 
      default: 'pending' 
    },
    adminVotes: { type: 'json', default: {} }, // { adminId: 'approve'|'reject' }
    requiredVotes: { type: 'integer', default: 2 },
    approvedBy: { type: 'uuid', nullable: true },
    approvedAt: { type: 'datetime', nullable: true },
    rejectedBy: { type: 'uuid', nullable: true },
    rejectedAt: { type: 'datetime', nullable: true },
    rejectionReason: { type: 'text', nullable: true },
    expiresAt: { type: 'datetime', nullable: true }, // Auto-expire after 24 hours
    createdAt: { type: 'datetime', onCreate: () => new Date() },
    updatedAt: { type: 'datetime', onUpdate: () => new Date() }
  },
  indexes: [
    { properties: 'targetUserId' },
    { properties: 'requestedBy' },
    { properties: 'status' },
    { properties: 'type' },
    { properties: 'createdAt' }
  ]
};

module.exports = BanRequest; 