const { EntitySchema } = require("@mikro-orm/core");

class Notification {
  constructor(userId, type, title, message, relatedEntityType, relatedEntityId, priority = 'normal') {
    this.userId = userId;
    this.type = type; // 'hold_reminder', 'dispute', 'watch_list', 'drop_shipping', 'system'
    this.title = title;
    this.message = message;
    this.relatedEntityType = relatedEntityType; // 'hold', 'item', 'dispute', 'watch_list', 'drop_shipping'
    this.relatedEntityId = relatedEntityId;
    this.priority = priority; // 'low', 'normal', 'high', 'urgent'
    this.read = false;
    this.readAt = null;
    this.actionUrl = null;
    this.metadata = null;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}

const schema = new EntitySchema({
  class: Notification,
  tableName: 'notifications',
  properties: {
    id: { primary: true, type: 'uuid' },
    userId: { type: 'uuid', nullable: false },
    type: { type: 'string', length: 30, nullable: false },
    title: { type: 'string', length: 200, nullable: false },
    message: { type: 'text', nullable: false },
    relatedEntityType: { type: 'string', length: 30, nullable: true },
    relatedEntityId: { type: 'uuid', nullable: true },
    priority: { type: 'string', length: 10, nullable: false },
    read: { type: 'boolean', nullable: false, default: false },
    readAt: { type: 'datetime', nullable: true },
    actionUrl: { type: 'text', nullable: true },
    metadata: { type: 'json', nullable: true },
    createdAt: { type: 'datetime', nullable: false },
    updatedAt: { type: 'datetime', nullable: false }
  },
  indexes: [
    { properties: ['userId'] },
    { properties: ['type'] },
    { properties: ['relatedEntityType'] },
    { properties: ['relatedEntityId'] },
    { properties: ['priority'] },
    { properties: ['read'] },
    { properties: ['createdAt'] }
  ]
});

module.exports = { Notification, schema }; 