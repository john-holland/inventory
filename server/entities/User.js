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
    banLevel: { 
      type: 'enum', 
      values: ['none', 'chat_limit', 'no_chat', 'list_ban', 'temporary', 'permanent'], 
      default: 'none' 
    },
    banReason: { type: 'text', nullable: true },
    banExpiresAt: { type: 'datetime', nullable: true },
    createdAt: { type: 'datetime', onCreate: () => new Date() },
    updatedAt: { type: 'datetime', onUpdate: () => new Date() },
    
    // Marketplace preferences
    marketplacePreferences: { 
      type: 'json', 
      default: {
        amazon: { enabled: true, gracefulFalloff: true },
        ebay: { enabled: true, gracefulFalloff: true }
      }
    },
    
    // Unleash toggles (admin only)
    unleashToggles: {
      type: 'json',
      default: {
        newFeatures: { enabled: false, description: 'Enable new experimental features' },
        betaFeatures: { enabled: false, description: 'Enable beta features for testing' },
        advancedAnalytics: { enabled: false, description: 'Enable advanced analytics dashboard' },
        aiIntegration: { enabled: false, description: 'Enable AI-powered recommendations' },
        realTimeNotifications: { enabled: false, description: 'Enable real-time push notifications' },
        darkMode: { enabled: false, description: 'Enable dark mode theme' },
        mobileOptimization: { enabled: false, description: 'Enable mobile-specific optimizations' },
        performanceMode: { enabled: false, description: 'Enable high-performance mode' },
        amazonIntegration: { enabled: true, description: 'Enable Amazon marketplace integration (disable for security/API issues)' },
        ebayIntegration: { enabled: true, description: 'Enable eBay marketplace integration (disable for security/API issues)' },
        marketplaceSearch: { enabled: true, description: 'Enable cross-marketplace search functionality' },
        autoSync: { enabled: true, description: 'Enable automatic marketplace data synchronization' },
        autoHealthcheckHousekeeping: { enabled: true, description: 'Enable automatic health check monitoring and management' }
      }
    },
    
    // Chat settings
    chatSettings: {
      type: 'json',
      default: {
        allowDirectMessages: true,
        allowGroupInvites: true,
        allowHerdChat: true,
        allowCorpoChat: false,
        notifications: {
          directMessages: true,
          groupMessages: true,
          friendRequests: true,
          mentions: true
        }
      }
    },
    
    // Relationships
    items: { reference: '1:m', entity: 'Item', mappedBy: 'lister' },
    holds: { reference: '1:m', entity: 'Hold', mappedBy: 'user' },
    transactions: { reference: '1:m', entity: 'Transaction', mappedBy: 'user' },
    investments: { reference: '1:m', entity: 'Investment', mappedBy: 'user' },
    waterLimits: { reference: '1:m', entity: 'WaterLimit', mappedBy: 'user' },
    chats: { reference: 'm:m', entity: 'Chat', owner: true },
    messages: { reference: '1:m', entity: 'Message', mappedBy: 'sender' },
    friendRequests: { reference: '1:m', entity: 'FriendRequest', mappedBy: 'sender' },
    receivedFriendRequests: { reference: '1:m', entity: 'FriendRequest', mappedBy: 'receiver' },
    employee: { reference: '1:1', entity: 'Employee', mappedBy: 'user' }
  },
  indexes: [
    { properties: 'username' },
    { properties: 'email' },
    { properties: 'role' },
    { properties: 'banLevel' }
  ]
};

module.exports = User; 