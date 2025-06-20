const { wrap } = require("@mikro-orm/core");
const { WaterLimitService } = require("./waterLimitService");

class BillingService {
  constructor(DI) {
    this.DI = DI;
    this.waterLimitService = new WaterLimitService(DI);
    this.serviceFees = {
      hold: 0.05, // 5% of hold amount - primary revenue source
      shipping: 0.10, // 10% of shipping cost - secondary revenue
      transaction: 0.029, // 2.9% + $0.30 per transaction (Stripe-like)
      investment: 0.01, // 1% of investment amount
      withdrawal: 0.25, // $0.25 withdrawal fee
      platform: 0.03 // 3% platform fee on successful transactions
    };
  }

  // Calculate service fee for a transaction
  calculateServiceFee(amount, feeType) {
    const feeRate = this.serviceFees[feeType];
    if (!feeRate) {
      throw new Error(`Unknown fee type: ${feeType}`);
    }

    if (feeType === 'transaction') {
      // Stripe-like pricing: 2.9% + $0.30
      return (amount * 0.029) + 0.30;
    }

    return amount * feeRate;
  }

  // Create billing record
  async createBillingRecord(userId, amount, feeType, description, metadata = {}) {
    const transaction = new this.DI.transactionRepository.entity(
      'service_fee',
      userId,
      null,
      -amount,
      description,
      'completed'
    );

    transaction.referenceId = `BILL_${Date.now()}`;
    transaction.metadata = {
      feeType,
      ...metadata
    };

    await this.DI.transactionRepository.persistAndFlush(transaction);
    return transaction;
  }

  // Calculate hold stagnation revenue (when holds are kept for extended periods)
  async calculateHoldStagnationRevenue(holdDurationDays, holdAmount) {
    // Revenue increases the longer holds are kept (encouraging platform usage)
    const baseStagnationRate = 0.001; // 0.1% per day
    const maxStagnationRate = 0.01; // Max 1% per day after 10 days
    
    const stagnationRate = Math.min(
      baseStagnationRate * Math.log10(holdDurationDays + 1),
      maxStagnationRate
    );
    
    return holdAmount * stagnationRate;
  }

  // Process optimistic energy economies (efficiency gains from platform usage)
  async processOptimisticEnergyEconomies(userId, transactionType, amount) {
    // Calculate energy savings from efficient routing and reduced shipping
    const energyEfficiencyRates = {
      'hold': 0.02, // 2% energy savings from optimized holds
      'shipping': 0.05, // 5% energy savings from route optimization
      'purchase': 0.03, // 3% energy savings from direct transactions
      'investment': 0.01 // 1% energy savings from digital transactions
    };

    const efficiencyRate = energyEfficiencyRates[transactionType] || 0;
    const energySavings = amount * efficiencyRate;

    // Convert energy savings to platform revenue
    const platformRevenue = energySavings * 0.5; // Platform keeps 50% of energy savings

    if (platformRevenue > 0) {
      // Add energy efficiency revenue to water limit instead of direct billing
      await this.waterLimitService.addToWaterLimit(
        userId,
        platformRevenue,
        'energy_efficiency'
      );

      // Create transaction record for energy efficiency (in water limit)
      const energyTransaction = new this.DI.transactionRepository.entity(
        'energy_efficiency',
        userId,
        null,
        platformRevenue,
        `Energy efficiency revenue from ${transactionType}`,
        'completed'
      );

      energyTransaction.metadata = {
        waterLimitType: 'energy_efficiency',
        transactionType,
        energySavings,
        originalAmount: amount,
        efficiencyRate
      };

      await this.DI.transactionRepository.persistAndFlush(energyTransaction);
    }

    return {
      energySavings,
      platformRevenue,
      efficiencyRate,
      waterLimitStatus: 'pending'
    };
  }

  // Process hold stagnation revenue through water limit
  async processHoldStagnationRevenue(userId, holdDurationDays, holdAmount) {
    const stagnationRevenue = await this.calculateHoldStagnationRevenue(holdDurationDays, holdAmount);
    
    if (stagnationRevenue > 0) {
      // Add stagnation revenue to water limit
      await this.waterLimitService.addToWaterLimit(
        userId,
        stagnationRevenue,
        'hold_stagnation'
      );

      // Create transaction record for stagnation revenue (in water limit)
      const stagnationTransaction = new this.DI.transactionRepository.entity(
        'hold_stagnation',
        userId,
        null,
        stagnationRevenue,
        `Hold stagnation revenue for ${Math.floor(holdDurationDays)} days`,
        'completed'
      );

      stagnationTransaction.metadata = {
        waterLimitType: 'hold_stagnation',
        holdDurationDays: Math.floor(holdDurationDays),
        holdAmount,
        stagnationRate: stagnationRevenue / holdAmount
      };

      await this.DI.transactionRepository.persistAndFlush(stagnationTransaction);
    }

    return {
      stagnationRevenue,
      holdDurationDays: Math.floor(holdDurationDays),
      waterLimitStatus: 'pending'
    };
  }

  // Get revenue analytics focused on hold stagnation and energy economies
  async getRevenueAnalytics(startDate, endDate) {
    try {
      const transactions = await this.DI.transactionRepository.find({
        type: { $in: ['service_fee', 'hold_stagnation', 'energy_efficiency'] },
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      });

      const revenueByType = {};
      let totalRevenue = 0;
      let holdStagnationRevenue = 0;
      let energyEfficiencyRevenue = 0;

      transactions.forEach(transaction => {
        const feeType = transaction.metadata?.feeType || transaction.type;
        const amount = Math.abs(transaction.amount);
        
        if (!revenueByType[feeType]) {
          revenueByType[feeType] = 0;
        }
        
        revenueByType[feeType] += amount;
        totalRevenue += amount;

        // Track specific revenue types
        if (transaction.type === 'hold_stagnation' || feeType === 'hold_stagnation') {
          holdStagnationRevenue += amount;
        }
        if (transaction.type === 'energy_efficiency' || feeType === 'energy_efficiency') {
          energyEfficiencyRevenue += amount;
        }
      });

      // Get water limit analytics for pending revenue
      const waterLimitAnalytics = await this.waterLimitService.getWaterLimitAnalytics();

      return {
        totalRevenue,
        revenueByType,
        holdStagnationRevenue,
        energyEfficiencyRevenue,
        transactionCount: transactions.length,
        period: { startDate, endDate },
        revenueBreakdown: {
          holdStagnationPercentage: (holdStagnationRevenue / totalRevenue) * 100,
          energyEfficiencyPercentage: (energyEfficiencyRevenue / totalRevenue) * 100
        },
        waterLimitAnalytics: {
          pendingRevenue: waterLimitAnalytics.totalPendingAmount,
          releasedRevenue: waterLimitAnalytics.totalReleasedAmount,
          averageHoldTime: waterLimitAnalytics.averageHoldTime,
          releaseRate: waterLimitAnalytics.releaseRate
        }
      };
    } catch (error) {
      console.error('Error getting revenue analytics:', error);
      throw error;
    }
  }

  // Get user billing history
  async getUserBillingHistory(userId, limit = 50) {
    try {
      const transactions = await this.DI.transactionRepository.find({
        userId,
        type: { $in: ['service_fee', 'hold_stagnation', 'energy_efficiency'] }
      }, {
        orderBy: { createdAt: 'DESC' },
        limit
      });

      // Get water limit summary for the user
      const waterLimitSummary = await this.waterLimitService.getUserWaterLimitSummary(userId);

      return {
        transactions: transactions.map(transaction => ({
          id: transaction.id,
          amount: Math.abs(transaction.amount),
          feeType: transaction.metadata?.feeType || transaction.type,
          description: transaction.description,
          createdAt: transaction.createdAt,
          referenceId: transaction.referenceId,
          waterLimitStatus: transaction.metadata?.waterLimitType ? 'pending' : 'direct'
        })),
        waterLimitSummary: {
          pendingRevenue: waterLimitSummary.totalPending,
          releasedRevenue: waterLimitSummary.totalReleased,
          byType: waterLimitSummary.byType
        }
      };
    } catch (error) {
      console.error('Error getting user billing history:', error);
      throw error;
    }
  }

  // Calculate platform revenue share from shipping and holds
  async calculateRevenueShare(userId, amount, transactionType) {
    // Platform takes a percentage of successful transactions
    const revenueShareRates = {
      'purchase': 0.03, // 3% of purchase amount
      'investment': 0.01, // 1% of investment amount
      'shipping': 0.05, // 5% of shipping cost
      'hold': 0.05, // 5% of hold amount
      'hold_stagnation': 0.10 // 10% of stagnation revenue
    };

    const rate = revenueShareRates[transactionType] || 0;
    const revenueShare = amount * rate;

    if (revenueShare > 0) {
      await this.createBillingRecord(
        userId,
        revenueShare,
        'revenue_share',
        `Platform revenue share for ${transactionType}`,
        { transactionType, originalAmount: amount }
      );
    }

    return revenueShare;
  }

  // Process refund
  async processRefund(userId, originalTransactionId, refundAmount, reason) {
    try {
      const originalTransaction = await this.DI.transactionRepository.findOneOrFail({
        id: originalTransactionId
      });

      const user = await this.DI.userRepository.findOneOrFail({ id: userId });

      // Add refund amount to user's balance
      wrap(user).assign({
        availableBalance: user.availableBalance + refundAmount
      });

      // Create refund transaction
      const refundTransaction = new this.DI.transactionRepository.entity(
        'refund',
        userId,
        originalTransaction.itemId,
        refundAmount,
        `Refund: ${reason}`,
        'completed'
      );

      refundTransaction.referenceId = `REF_${Date.now()}`;
      refundTransaction.metadata = {
        originalTransactionId,
        reason
      };

      await this.DI.transactionRepository.persistAndFlush(refundTransaction);
      await this.DI.userRepository.flush();

      return refundTransaction;
    } catch (error) {
      console.error('Error processing refund:', error);
      throw error;
    }
  }

  // Get hold stagnation analytics
  async getHoldStagnationAnalytics() {
    try {
      const items = await this.DI.itemRepository.find({
        currentHolderId: { $ne: null },
        holdAmount: { $gt: 0 }
      });

      const stagnationData = items.map(item => {
        const holdDurationDays = (Date.now() - item.updatedAt.getTime()) / (1000 * 60 * 60 * 24);
        const stagnationRevenue = this.calculateHoldStagnationRevenue(holdDurationDays, item.holdAmount);
        
        return {
          itemId: item.id,
          itemTitle: item.title,
          holderId: item.currentHolderId,
          holdAmount: item.holdAmount,
          holdDurationDays: Math.floor(holdDurationDays),
          stagnationRevenue: stagnationRevenue,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt
        };
      });

      const totalStagnationRevenue = stagnationData.reduce((sum, item) => sum + item.stagnationRevenue, 0);
      const averageHoldDuration = stagnationData.reduce((sum, item) => sum + item.holdDurationDays, 0) / stagnationData.length;

      return {
        activeHolds: stagnationData.length,
        totalStagnationRevenue,
        averageHoldDuration,
        holdDetails: stagnationData
      };
    } catch (error) {
      console.error('Error getting hold stagnation analytics:', error);
      throw error;
    }
  }
}

module.exports = { BillingService }; 