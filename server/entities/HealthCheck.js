"use strict";
const { EntitySchema } = require("@mikro-orm/core");

const HealthCheck = {
  name: 'HealthCheck',
  tableName: 'health_checks',
  properties: {
    id: { primary: true, type: 'uuid' },
    service: { type: 'string', length: 50 }, // 'amazon', 'ebay'
    status: { 
      type: 'enum', 
      values: ['healthy', 'degraded', 'down', 'maintenance'], 
      default: 'healthy' 
    },
    responseTime: { type: 'integer', nullable: true }, // milliseconds
    errorMessage: { type: 'text', nullable: true },
    lastChecked: { type: 'datetime', onCreate: () => new Date() },
    nextCheck: { type: 'datetime', nullable: true },
    consecutiveFailures: { type: 'integer', default: 0 },
    autoDisabled: { type: 'boolean', default: false },
    autoDisabledAt: { type: 'datetime', nullable: true },
    autoDisabledBy: { type: 'string', length: 50, default: 'system' },
    reEnabledAt: { type: 'datetime', nullable: true },
    reEnabledBy: { type: 'string', length: 50, nullable: true },
    createdAt: { type: 'datetime', onCreate: () => new Date() },
    updatedAt: { type: 'datetime', onUpdate: () => new Date() }
  },
  indexes: [
    { properties: 'service' },
    { properties: 'status' },
    { properties: 'lastChecked' },
    { properties: 'autoDisabled' }
  ]
};

module.exports = HealthCheck; 