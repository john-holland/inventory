"use strict";
const { EntitySchema } = require("@mikro-orm/core");
const { BaseEntity } = require("./BaseEntity");

class Message extends BaseEntity {
  constructor(chatId, senderId, content, type) {
    super();
    this.chatId = chatId; // Chat ID this message belongs to
    this.senderId = senderId; // User ID who sent the message
    this.content = content; // Message content
    this.type = type; // 'text', 'image', 'file', 'system'
    this.isEdited = false; // Whether message has been edited
    this.editedAt = null; // When message was edited
    this.isDeleted = false; // Whether message is deleted
    this.deletedAt = null; // When message was deleted
    this.reactions = []; // Array of reaction objects
    this.replies = []; // Array of reply message IDs
    this.attachments = []; // Array of attachment objects
    this.metadata = {
      readBy: [], // Array of user IDs who have read the message
      deliveredTo: [], // Array of user IDs who have received the message
      timestamp: new Date()
    };
  }
}

const schema = new EntitySchema({
  class: Message,
  extends: "BaseEntity",
  properties: {
    chatId: { type: "number" },
    senderId: { type: "number" },
    content: { type: "text" },
    type: { type: "string", default: "text" },
    isEdited: { type: "boolean", default: false },
    editedAt: { type: "Date", nullable: true },
    isDeleted: { type: "boolean", default: false },
    deletedAt: { type: "Date", nullable: true },
    reactions: { type: "json", default: [] },
    replies: { type: "json", default: [] },
    attachments: { type: "json", default: [] },
    metadata: { type: "json", default: {} },
  },
});

module.exports = {
  Message,
  entity: Message,
  schema,
  label: "messageRepository",
}; 