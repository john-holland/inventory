const { Client, resources } = require('coinbase-commerce-node');
const QRCode = require('qrcode');
const crypto = require('crypto');
const { wrap } = require("@mikro-orm/core");
const { WaterLimitService } = require("./waterLimitService");

class CoinbaseCommerceService {
  constructor(DI) {
    this.DI = DI;
    this.waterLimitService = new WaterLimitService(DI);
    this.client = new Client({
      apiKey: process.env.COINBASE_COMMERCE_API_KEY
    });
    
    this.supportedCryptocurrencies = [
      'BTC', 'ETH', 'USDC', 'USDT', 'LTC', 'BCH', 'XRP', 'ADA', 'DOT', 'LINK'
    ];
    
    this.serviceFees = {
      crypto_transaction: 0.01, // 1% for crypto transactions
      crypto_conversion: 0.005, // 0.5% for crypto to USD conversion
      oauth_verification: 0.001 // 0.1% for OAuth verification
    };
  }

  // Create a cryptocurrency payment charge
  async createCryptoPayment(userId, amount, currency = 'USD', preferredCrypto = null) {
    try {
      const user = await this.DI.userRepository.findOneOrFail({ id: userId });
      
      // Calculate service fees
      const serviceFee = this.calculateServiceFee(amount, 'crypto_transaction');
      const totalAmount = amount + serviceFee;

      // Create charge with Coinbase Commerce
      const charge = await this.client.charges.create({
        name: `Inventory System Payment - User ${userId}`,
        description: `Payment for inventory system services`,
        local_price: {
          amount: totalAmount.toString(),
          currency: currency
        },
        pricing_type: 'fixed_price',
        metadata: {
          userId: userId,
          serviceFee: serviceFee,
          originalAmount: amount
        }
      });

      // Store payment record
      const cryptoPayment = new this.DI.cryptoPaymentRepository.entity(
        userId,
        charge.id,
        amount,
        totalAmount,
        currency,
        preferredCrypto,
        'pending',
        charge.hosted_url,
        charge.code
      );

      await this.DI.cryptoPaymentRepository.persistAndFlush(cryptoPayment);

      // Create transaction record
      const transaction = new this.DI.transactionRepository.entity(
        'crypto_payment',
        userId,
        cryptoPayment.id,
        -totalAmount,
        `Cryptocurrency payment via Coinbase Commerce`,
        'pending'
      );

      transaction.referenceId = `CRYPTO_${charge.id}`;
      transaction.metadata = {
        chargeId: charge.id,
        serviceFee,
        currency,
        preferredCrypto
      };

      await this.DI.transactionRepository.persistAndFlush(transaction);

      return {
        charge,
        cryptoPayment,
        serviceFee,
        totalAmount,
        paymentUrl: charge.hosted_url,
        qrCode: await this.generatePaymentQR(charge.hosted_url)
      };
    } catch (error) {
      console.error('Error creating crypto payment:', error);
      throw new Error(`Failed to create cryptocurrency payment: ${error.message}`);
    }
  }

  // Generate QR code for payment
  async generatePaymentQR(paymentUrl) {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(paymentUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      return qrCodeDataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      return null;
    }
  }

  // Handle webhook from Coinbase Commerce
  async handleWebhook(payload, signature) {
    try {
      // Verify webhook signature
      const expectedSignature = crypto
        .createHmac('sha256', process.env.COINBASE_COMMERCE_WEBHOOK_SECRET)
        .update(JSON.stringify(payload))
        .digest('hex');

      if (signature !== expectedSignature) {
        throw new Error('Invalid webhook signature');
      }

      const { id, type, data } = payload;

      if (type === 'charge:confirmed') {
        await this.processConfirmedPayment(data);
      } else if (type === 'charge:failed') {
        await this.processFailedPayment(data);
      } else if (type === 'charge:delayed') {
        await this.processDelayedPayment(data);
      }

      return { success: true, processed: type };
    } catch (error) {
      console.error('Error processing webhook:', error);
      throw error;
    }
  }

  // Process confirmed cryptocurrency payment
  async processConfirmedPayment(chargeData) {
    const { id, payments, metadata } = chargeData;
    
    const cryptoPayment = await this.DI.cryptoPaymentRepository.findOne({ chargeId: id });
    if (!cryptoPayment) {
      throw new Error(`Crypto payment not found for charge ID: ${id}`);
    }

    const user = await this.DI.userRepository.findOneOrFail({ id: cryptoPayment.userId });
    const originalAmount = parseFloat(metadata.originalAmount);
    const serviceFee = parseFloat(metadata.serviceFee);

    // Update payment status
    wrap(cryptoPayment).assign({
      status: 'completed',
      confirmedAt: new Date(),
      paymentDetails: payments
    });

    // Add funds to user's available balance
    wrap(user).assign({
      availableBalance: user.availableBalance + originalAmount
    });

    // Update transaction status
    const transaction = await this.DI.transactionRepository.findOne({ 
      referenceId: `CRYPTO_${id}` 
    });
    
    if (transaction) {
      wrap(transaction).assign({
        status: 'completed',
        metadata: {
          ...transaction.metadata,
          confirmedAt: new Date(),
          paymentDetails: payments
        }
      });
    }

    // Add service fee to water limit
    await this.waterLimitService.addToWaterLimit(
      cryptoPayment.userId,
      serviceFee,
      'crypto_service_fee',
      cryptoPayment.id
    );

    await this.DI.cryptoPaymentRepository.flush();
    await this.DI.userRepository.flush();
    await this.DI.transactionRepository.flush();

    return { success: true, amount: originalAmount, serviceFee };
  }

  // Process failed cryptocurrency payment
  async processFailedPayment(chargeData) {
    const { id } = chargeData;
    
    const cryptoPayment = await this.DI.cryptoPaymentRepository.findOne({ chargeId: id });
    if (!cryptoPayment) {
      throw new Error(`Crypto payment not found for charge ID: ${id}`);
    }

    // Update payment status
    wrap(cryptoPayment).assign({
      status: 'failed',
      failedAt: new Date()
    });

    // Update transaction status
    const transaction = await this.DI.transactionRepository.findOne({ 
      referenceId: `CRYPTO_${id}` 
    });
    
    if (transaction) {
      wrap(transaction).assign({
        status: 'failed',
        metadata: {
          ...transaction.metadata,
          failedAt: new Date()
        }
      });
    }

    await this.DI.cryptoPaymentRepository.flush();
    await this.DI.transactionRepository.flush();

    return { success: true, status: 'failed' };
  }

  // Process delayed cryptocurrency payment
  async processDelayedPayment(chargeData) {
    const { id } = chargeData;
    
    const cryptoPayment = await this.DI.cryptoPaymentRepository.findOne({ chargeId: id });
    if (!cryptoPayment) {
      throw new Error(`Crypto payment not found for charge ID: ${id}`);
    }

    // Update payment status
    wrap(cryptoPayment).assign({
      status: 'delayed',
      delayedAt: new Date()
    });

    await this.DI.cryptoPaymentRepository.flush();

    return { success: true, status: 'delayed' };
  }

  // Get cryptocurrency payment status
  async getPaymentStatus(chargeId) {
    try {
      const charge = await this.client.charges.retrieve(chargeId);
      return {
        id: charge.id,
        status: charge.timeline[charge.timeline.length - 1].status,
        amount: charge.pricing.local.amount,
        currency: charge.pricing.local.currency,
        payments: charge.payments,
        timeline: charge.timeline
      };
    } catch (error) {
      console.error('Error retrieving payment status:', error);
      throw new Error(`Failed to retrieve payment status: ${error.message}`);
    }
  }

  // Get user's cryptocurrency payment history
  async getUserCryptoPayments(userId, limit = 50) {
    const payments = await this.DI.cryptoPaymentRepository.find(
      { userId },
      { limit, orderBy: { createdAt: 'DESC' } }
    );

    return payments.map(payment => ({
      id: payment.id,
      chargeId: payment.chargeId,
      amount: payment.amount,
      totalAmount: payment.totalAmount,
      currency: payment.currency,
      preferredCrypto: payment.preferredCrypto,
      status: payment.status,
      createdAt: payment.createdAt,
      confirmedAt: payment.confirmedAt,
      paymentUrl: payment.paymentUrl
    }));
  }

  // Calculate service fee for cryptocurrency transactions
  calculateServiceFee(amount, feeType) {
    const feeRate = this.serviceFees[feeType];
    if (!feeRate) {
      throw new Error(`Unknown fee type: ${feeType}`);
    }
    return amount * feeRate;
  }

  // Get supported cryptocurrencies
  getSupportedCryptocurrencies() {
    return this.supportedCryptocurrencies.map(crypto => ({
      symbol: crypto,
      name: this.getCryptoName(crypto),
      decimals: this.getCryptoDecimals(crypto)
    }));
  }

  // Get cryptocurrency name
  getCryptoName(symbol) {
    const names = {
      'BTC': 'Bitcoin',
      'ETH': 'Ethereum',
      'USDC': 'USD Coin',
      'USDT': 'Tether',
      'LTC': 'Litecoin',
      'BCH': 'Bitcoin Cash',
      'XRP': 'Ripple',
      'ADA': 'Cardano',
      'DOT': 'Polkadot',
      'LINK': 'Chainlink'
    };
    return names[symbol] || symbol;
  }

  // Get cryptocurrency decimals
  getCryptoDecimals(symbol) {
    const decimals = {
      'BTC': 8,
      'ETH': 18,
      'USDC': 6,
      'USDT': 6,
      'LTC': 8,
      'BCH': 8,
      'XRP': 6,
      'ADA': 6,
      'DOT': 10,
      'LINK': 18
    };
    return decimals[symbol] || 8;
  }

  // Get cryptocurrency analytics
  async getCryptoAnalytics(startDate, endDate) {
    const payments = await this.DI.cryptoPaymentRepository.find({
      createdAt: {
        $gte: startDate,
        $lte: endDate
      }
    });

    const analytics = {
      totalPayments: payments.length,
      totalAmount: 0,
      totalServiceFees: 0,
      byStatus: {},
      byCurrency: {},
      byCrypto: {}
    };

    payments.forEach(payment => {
      analytics.totalAmount += payment.amount;
      analytics.totalServiceFees += (payment.totalAmount - payment.amount);

      // By status
      if (!analytics.byStatus[payment.status]) {
        analytics.byStatus[payment.status] = { count: 0, amount: 0 };
      }
      analytics.byStatus[payment.status].count++;
      analytics.byStatus[payment.status].amount += payment.amount;

      // By currency
      if (!analytics.byCurrency[payment.currency]) {
        analytics.byCurrency[payment.currency] = { count: 0, amount: 0 };
      }
      analytics.byCurrency[payment.currency].count++;
      analytics.byCurrency[payment.currency].amount += payment.amount;

      // By preferred crypto
      if (payment.preferredCrypto) {
        if (!analytics.byCrypto[payment.preferredCrypto]) {
          analytics.byCrypto[payment.preferredCrypto] = { count: 0, amount: 0 };
        }
        analytics.byCrypto[payment.preferredCrypto].count++;
        analytics.byCrypto[payment.preferredCrypto].amount += payment.amount;
      }
    });

    return analytics;
  }
}

module.exports = { CoinbaseCommerceService }; 