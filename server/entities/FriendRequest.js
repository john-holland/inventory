"use strict";
const { EntitySchema } = require("@mikro-orm/core");
const { BaseEntity } = require("./BaseEntity");

class FriendRequest extends BaseEntity {
  constructor(senderId, receiverId, message) {
    super();
    this.senderId = senderId; // User ID sending the request
    this.receiverId = receiverId; // User ID receiving the request
    this.message = message; // Optional message with the request
    this.status = 'pending'; // 'pending', 'accepted', 'declined', 'blocked'
    this.sentAt = new Date(); // When request was sent
    this.respondedAt = null; // When request was responded to
    this.emailSent = false; // Whether email notification was sent
    this.emailSentAt = null; // When email was sent
    this.metadata = {
      senderUsername: '',
      receiverUsername: '',
      senderEmail: '',
      receiverEmail: ''
    };
  }
}

const schema = new EntitySchema({
  class: FriendRequest,
  extends: "BaseEntity",
  properties: {
    senderId: { type: "number" },
    receiverId: { type: "number" },
    message: { type: "text", nullable: true },
    status: { type: "string", default: "pending" },
    sentAt: { type: "Date" },
    respondedAt: { type: "Date", nullable: true },
    emailSent: { type: "boolean", default: false },
    emailSentAt: { type: "Date", nullable: true },
    metadata: { type: "json", default: {} },
  },
});

module.exports = {
  FriendRequest,
  entity: FriendRequest,
  schema,
  label: "friendRequestRepository",
}; 