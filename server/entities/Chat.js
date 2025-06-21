"use strict";
const { EntitySchema } = require("@mikro-orm/core");
const { BaseEntity } = require("./BaseEntity");

class Chat extends BaseEntity {
  constructor(type, name, createdBy) {
    super();
    this.type = type; // 'direct', 'group', 'herd', 'corpo'
    this.name = name; // Chat name
    this.createdBy = createdBy; // User who created the chat
    this.participants = [createdBy]; // Array of user IDs
    this.messages = []; // Array of message IDs
    this.isActive = true; // Whether chat is active
    this.lastMessageAt = new Date(); // Last message timestamp
    this.settings = {
      allowInvites: type === 'group' || type === 'corpo',
      requireApproval: type === 'group',
      maxParticipants: type === 'herd' ? 1000 : type === 'corpo' ? 500 : 50,
      ttl: type === 'herd' ? 90 : null // TTL in days (null = indefinite)
    };
    this.metadata = {
      totalMessages: 0,
      totalParticipants: 1,
      createdDate: new Date(),
      lastActivity: new Date()
    };
  }
}

const schema = new EntitySchema({
  class: Chat,
  extends: "BaseEntity",
  properties: {
    type: { type: "string" }, // 'direct', 'group', 'herd', 'corpo'
    name: { type: "string" },
    createdBy: { type: "number" },
    participants: { type: "json", default: [] },
    messages: { type: "json", default: [] },
    isActive: { type: "boolean", default: true },
    lastMessageAt: { type: "Date" },
    settings: { type: "json", default: {} },
    metadata: { type: "json", default: {} },
  },
});

module.exports = {
  Chat,
  entity: Chat,
  schema,
  label: "chatRepository",
}; 