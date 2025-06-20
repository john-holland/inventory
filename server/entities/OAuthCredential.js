const { EntitySchema } = require("@mikro-orm/core");

class OAuthCredential {
  constructor(userId, provider, accessToken, refreshToken, profile, status) {
    this.userId = userId;
    this.provider = provider;
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    this.profile = profile;
    this.status = status;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}

const schema = new EntitySchema({
  class: OAuthCredential,
  tableName: 'oauth_credentials',
  properties: {
    id: { primary: true, type: 'uuid' },
    userId: { type: 'uuid', nullable: false },
    provider: { type: 'string', length: 50, nullable: false },
    accessToken: { type: 'text', nullable: false },
    refreshToken: { type: 'text', nullable: true },
    profile: { type: 'json', nullable: true },
    status: { type: 'string', length: 20, nullable: false },
    revokedAt: { type: 'datetime', nullable: true },
    createdAt: { type: 'datetime', nullable: false },
    updatedAt: { type: 'datetime', nullable: false }
  },
  indexes: [
    { properties: ['userId'] },
    { properties: ['provider'] },
    { properties: ['status'] },
    { properties: ['createdAt'] }
  ]
});

module.exports = { OAuthCredential, schema }; 