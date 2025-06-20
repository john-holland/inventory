const { EntitySchema } = require("@mikro-orm/core");

class OAuthState {
  constructor(userId, provider, state, expiresAt) {
    this.userId = userId;
    this.provider = provider;
    this.state = state;
    this.expiresAt = expiresAt;
    this.used = false;
    this.createdAt = new Date();
  }
}

const schema = new EntitySchema({
  class: OAuthState,
  tableName: 'oauth_states',
  properties: {
    id: { primary: true, type: 'uuid' },
    userId: { type: 'uuid', nullable: false },
    provider: { type: 'string', length: 50, nullable: false },
    state: { type: 'string', length: 255, nullable: false },
    expiresAt: { type: 'datetime', nullable: false },
    used: { type: 'boolean', nullable: false, default: false },
    usedAt: { type: 'datetime', nullable: true },
    createdAt: { type: 'datetime', nullable: false }
  },
  indexes: [
    { properties: ['userId'] },
    { properties: ['provider'] },
    { properties: ['state'] },
    { properties: ['expiresAt'] },
    { properties: ['used'] }
  ]
});

module.exports = { OAuthState, schema }; 