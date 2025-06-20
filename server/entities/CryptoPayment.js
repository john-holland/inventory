const { EntitySchema } = require("@mikro-orm/core");

class CryptoPayment {
  constructor(userId, chargeId, amount, totalAmount, currency, preferredCrypto, status, paymentUrl, code) {
    this.userId = userId;
    this.chargeId = chargeId;
    this.amount = amount;
    this.totalAmount = totalAmount;
    this.currency = currency;
    this.preferredCrypto = preferredCrypto;
    this.status = status;
    this.paymentUrl = paymentUrl;
    this.code = code;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}

const schema = new EntitySchema({
  class: CryptoPayment,
  tableName: 'crypto_payments',
  properties: {
    id: { primary: true, type: 'uuid' },
    userId: { type: 'uuid', nullable: false },
    chargeId: { type: 'string', nullable: false },
    amount: { type: 'decimal', precision: 10, scale: 2, nullable: false },
    totalAmount: { type: 'decimal', precision: 10, scale: 2, nullable: false },
    currency: { type: 'string', length: 3, nullable: false },
    preferredCrypto: { type: 'string', length: 10, nullable: true },
    status: { type: 'string', length: 20, nullable: false },
    paymentUrl: { type: 'text', nullable: true },
    code: { type: 'string', length: 100, nullable: true },
    paymentDetails: { type: 'json', nullable: true },
    confirmedAt: { type: 'datetime', nullable: true },
    failedAt: { type: 'datetime', nullable: true },
    delayedAt: { type: 'datetime', nullable: true },
    createdAt: { type: 'datetime', nullable: false },
    updatedAt: { type: 'datetime', nullable: false }
  },
  indexes: [
    { properties: ['userId'] },
    { properties: ['chargeId'] },
    { properties: ['status'] },
    { properties: ['createdAt'] }
  ]
});

module.exports = { CryptoPayment, schema }; 