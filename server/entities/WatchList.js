"use strict";
const { EntitySchema } = require("@mikro-orm/core");
const { BaseEntity } = require("./BaseEntity");

class WatchList extends BaseEntity {
  constructor(userId, itemId, notificationPreferences = {}) {
    super();
    this.userId = userId;
    this.itemId = itemId;
    this.notificationPreferences = {
      priceChanges: true,
      availability: true,
      newHolds: false,
      itemUpdates: true,
      ...notificationPreferences
    };
    this.lastNotifiedAt = null;
    this.watchDate = new Date();
    this.metadata = {
      watchReason: '',
      notes: '',
      priority: 0,
      tags: [],
      customFields: {}
    };
  }
}

const schema = new EntitySchema({
  class: WatchList,
  extends: "BaseEntity",
  properties: {
    userId: { type: "number" },
    itemId: { type: "number" },
    notificationPreferences: { type: "json", default: {} },
    lastNotifiedAt: { type: "Date", nullable: true },
    watchDate: { type: "Date" },
    metadata: { type: "json", default: {} },
  },
  indexes: [
    { properties: ['userId'] },
    { properties: ['itemId'] },
    { properties: ['userId', 'itemId'], unique: true }
  ]
});

module.exports = {
  WatchList,
  entity: WatchList,
  schema,
  label: "watchListRepository",
}; 