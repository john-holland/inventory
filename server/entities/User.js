"use strict";
const { EntitySchema } = require("@mikro-orm/core");
const { BaseEntity } = require("./BaseEntity");

const User = {
  name: 'User',
  tableName: 'users',
  properties: {
    id: { primary: true, type: 'uuid' },
    username: { type: 'string', unique: true, length: 50 },
    email: { type: 'string', unique: true, length: 100 },
    password: { type: 'string', length: 255 },
    wallet: { type: 'decimal', precision: 10, scale: 2, default: 1000.00 },
    role: { type: 'string', length: 20, default: 'user' },
    isActive: { type: 'boolean', default: true },
    createdAt: { type: 'datetime', onCreate: () => new Date() },
    updatedAt: { type: 'datetime', onUpdate: () => new Date() },
    
    // Relationships
    items: { reference: '1:m', entity: 'Item', mappedBy: 'lister' },
    holds: { reference: '1:m', entity: 'Hold', mappedBy: 'user' },
    transactions: { reference: '1:m', entity: 'Transaction', mappedBy: 'user' },
    investments: { reference: '1:m', entity: 'Investment', mappedBy: 'user' },
    waterLimits: { reference: '1:m', entity: 'WaterLimit', mappedBy: 'user' }
  },
  indexes: [
    { properties: 'username' },
    { properties: 'email' },
    { properties: 'role' }
  ]
};

module.exports = User; 