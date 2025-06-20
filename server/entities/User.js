"use strict";
const { EntitySchema } = require("@mikro-orm/core");
const { BaseEntity } = require("./BaseEntity");

class User extends BaseEntity {
  constructor(email, username, passwordHash, walletAddress) {
    super();
    this.email = email;
    this.username = username;
    this.passwordHash = passwordHash;
    this.walletAddress = walletAddress;
    this.isVerified = false;
    this.rating = 0;
    this.totalTransactions = 0;
    this.availableBalance = 0;
    this.heldBalance = 0;
    this.location = null;
    this.preferences = {};
    this.useMetricUnits = false;
  }
}

const schema = new EntitySchema({
  class: User,
  extends: "BaseEntity",
  properties: {
    email: { type: "string", unique: true },
    username: { type: "string", unique: true },
    passwordHash: { type: "string" },
    walletAddress: { type: "string", nullable: true },
    isVerified: { type: "boolean", default: false },
    rating: { type: "number", default: 0 },
    totalTransactions: { type: "number", default: 0 },
    availableBalance: { type: "number", default: 0 },
    heldBalance: { type: "number", default: 0 },
    location: { type: "json", nullable: true },
    preferences: { type: "json", default: {} },
    useMetricUnits: { type: "boolean", default: false },
  },
});

module.exports = {
  User,
  entity: User,
  schema,
  label: "userRepository",
}; 