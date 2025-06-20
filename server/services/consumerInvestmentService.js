const { wrap } = require("@mikro-orm/core");

class ConsumerInvestmentService {
  constructor(DI) {
    this.DI = DI;
    this.revenueSplit = {
      consumerShare: 0.5, // 50% for consumer direct investment
      platformShare: 0.5, // 50% for platform investment
      distributionStrategy: 'equal_share' // Equal distribution among all consumers
    };
  }

  // Create consumer investment when a hold is placed
  async createConsumerInvestment(userId, itemId, holdAmount) {
    const item = await this.DI.itemRepository.findOneOrFail({ id: itemId });
    const user = await this.DI.userRepository.findOneOrFail({ id: userId });

    // Calculate investment amounts (50/50 split)
    const consumerInvestmentAmount = holdAmount * this.revenueSplit.consumerShare;
    const platformInvestmentAmount = holdAmount * this.revenueSplit.platformShare;

    // Check if user has sufficient balance for their share
    if (user.availableBalance < consumerInvestmentAmount) {
      throw new Error(`Insufficient balance. Required: $${consumerInvestmentAmount}, Available: $${user.availableBalance}`);
    }

    // Create consumer investment record
    const consumerInvestment = new this.DI.consumerInvestmentRepository.entity(
      userId,
      itemId,
      holdAmount,
      consumerInvestmentAmount,
      platformInvestmentAmount,
      'active'
    );

    // Update metadata
    consumerInvestment.metadata = {
      itemTitle: item.title,
      itemCategory: item.category,
      holdDuration: 0,
      investmentStrategy: 'hold_based',
      consumerShare: this.revenueSplit.consumerShare,
      platformShare: this.revenueSplit.platformShare
    };

    // Deduct consumer investment from user's balance
    wrap(user).assign({
      availableBalance: user.availableBalance - consumerInvestmentAmount
    });

    // Create transaction for consumer investment
    const consumerTransaction = new this.DI.transactionRepository.entity(
      'consumer_investment',
      userId,
      itemId,
      -consumerInvestmentAmount,
      `Consumer investment in hold for ${item.title}`,
      'completed'
    );

    consumerTransaction.metadata = {
      investmentType: 'consumer_direct',
      itemId: itemId,
      holdAmount: holdAmount
    };

    // Update platform investment (create or update existing)
    await this.updatePlatformInvestment(platformInvestmentAmount, 1);

    // Create transaction for platform investment
    const platformTransaction = new this.DI.transactionRepository.entity(
      'platform_investment',
      null, // No specific user for platform investment
      itemId,
      -platformInvestmentAmount,
      `Platform investment from hold for ${item.title}`,
      'completed'
    );

    platformTransaction.metadata = {
      investmentType: 'platform_shared',
      itemId: itemId,
      holdAmount: holdAmount,
      userId: userId // Track which user's hold generated this investment
    };

    await this.DI.consumerInvestmentRepository.persistAndFlush(consumerInvestment);
    await this.DI.transactionRepository.persistAndFlush(consumerTransaction);
    await this.DI.transactionRepository.persistAndFlush(platformTransaction);
    await this.DI.userRepository.flush();

    return {
      consumerInvestment,
      consumerInvestmentAmount,
      platformInvestmentAmount,
      totalHoldAmount: holdAmount
    };
  }

  // Update platform investment totals
  async updatePlatformInvestment(amount, holdCountChange = 0) {
    let platformInvestment = await this.DI.platformInvestmentRepository.findOne({
      status: 'active'
    });

    if (!platformInvestment) {
      // Create new platform investment record
      platformInvestment = new this.DI.platformInvestmentRepository.entity(
        amount,
        1,
        'active'
      );
    } else {
      // Update existing platform investment
      wrap(platformInvestment).assign({
        totalInvestedAmount: platformInvestment.totalInvestedAmount + amount,
        activeHoldCount: platformInvestment.activeHoldCount + holdCountChange
      });
    }

    await this.DI.platformInvestmentRepository.persistAndFlush(platformInvestment);
    return platformInvestment;
  }

  // Calculate returns for consumer investments
  async calculateConsumerInvestmentReturns() {
    const activeInvestments = await this.DI.consumerInvestmentRepository.find({
      status: 'active'
    });

    const results = {
      processed: 0,
      totalConsumerReturns: 0,
      totalPlatformReturns: 0,
      individualReturns: []
    };

    for (const investment of activeInvestments) {
      try {
        const item = await this.DI.itemRepository.findOne({ id: investment.itemId });
        if (!item) continue;

        // Calculate hold duration
        const holdDuration = (Date.now() - investment.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        
        // Calculate returns based on hold duration and investment amount
        const consumerReturn = await this.calculateInvestmentReturn(
          investment.consumerInvestmentAmount,
          holdDuration,
          'consumer'
        );

        const platformReturn = await this.calculateInvestmentReturn(
          investment.platformInvestmentAmount,
          holdDuration,
          'platform'
        );

        // Update investment with returns
        wrap(investment).assign({
          currentValue: investment.consumerInvestmentAmount + consumerReturn + platformReturn,
          returnRate: ((consumerReturn + platformReturn) / investment.holdAmount) * 100,
          consumerReturnAmount: consumerReturn,
          platformReturnAmount: platformReturn,
          lastUpdated: new Date()
        });

        results.totalConsumerReturns += consumerReturn;
        results.totalPlatformReturns += platformReturn;
        results.individualReturns.push({
          investmentId: investment.id,
          userId: investment.userId,
          consumerReturn,
          platformReturn,
          totalReturn: consumerReturn + platformReturn
        });

        results.processed++;
      } catch (error) {
        console.error(`Error calculating returns for investment ${investment.id}:`, error);
      }
    }

    await this.DI.consumerInvestmentRepository.flush();
    return results;
  }

  // Calculate investment return based on amount and duration
  async calculateInvestmentReturn(amount, durationDays, type) {
    // Different return rates for consumer vs platform investments
    const returnRates = {
      consumer: {
        baseRate: 0.05, // 5% annual return
        durationMultiplier: 0.1, // 10% per day
        maxRate: 0.15 // Max 15% return
      },
      platform: {
        baseRate: 0.08, // 8% annual return (higher for platform)
        durationMultiplier: 0.15, // 15% per day
        maxRate: 0.25 // Max 25% return
      }
    };

    const config = returnRates[type];
    const dailyReturn = config.baseRate / 365;
    const durationBonus = Math.min(durationDays * config.durationMultiplier, config.maxRate);
    const totalReturnRate = dailyReturn + durationBonus;

    return amount * totalReturnRate;
  }

  // Distribute platform investment returns equally among all consumers
  async distributePlatformReturns() {
    const platformInvestment = await this.DI.platformInvestmentRepository.findOne({
      status: 'active'
    });

    if (!platformInvestment || platformInvestment.undistributedAmount <= 0) {
      return { distributed: 0, amount: 0 };
    }

    // Get all active consumers (users with active holds)
    const activeConsumers = await this.DI.consumerInvestmentRepository.find({
      status: 'active'
    });

    if (activeConsumers.length === 0) {
      return { distributed: 0, amount: 0 };
    }

    // Calculate equal share for each consumer
    const equalShare = platformInvestment.undistributedAmount / activeConsumers.length;
    let totalDistributed = 0;

    for (const consumer of activeConsumers) {
      const user = await this.DI.userRepository.findOne({ id: consumer.userId });
      if (!user) continue;

      // Add shared return to consumer investment
      wrap(consumer).assign({
        sharedReturnAmount: consumer.sharedReturnAmount + equalShare
      });

      // Add funds to user's available balance
      wrap(user).assign({
        availableBalance: user.availableBalance + equalShare
      });

      // Create transaction for shared return
      const sharedReturnTransaction = new this.DI.transactionRepository.entity(
        'platform_shared_return',
        consumer.userId,
        consumer.itemId,
        equalShare,
        `Shared platform return for hold investment`,
        'completed'
      );

      sharedReturnTransaction.metadata = {
        investmentType: 'platform_shared',
        consumerInvestmentId: consumer.id,
        distributionType: 'equal_share'
      };

      await this.DI.transactionRepository.persistAndFlush(sharedReturnTransaction);
      totalDistributed += equalShare;
    }

    // Update platform investment
    wrap(platformInvestment).assign({
      distributedAmount: platformInvestment.distributedAmount + totalDistributed,
      undistributedAmount: 0,
      lastDistributionDate: new Date()
    });

    // Add distribution to history
    platformInvestment.metadata.distributionHistory.push({
      date: new Date(),
      amount: totalDistributed,
      consumerCount: activeConsumers.length,
      sharePerConsumer: equalShare
    });

    await this.DI.consumerInvestmentRepository.flush();
    await this.DI.userRepository.flush();
    await this.DI.platformInvestmentRepository.flush();

    return {
      distributed: activeConsumers.length,
      amount: totalDistributed,
      sharePerConsumer: equalShare
    };
  }

  // Complete consumer investment when hold is released
  async completeConsumerInvestment(investmentId, completionType = 'hold_release') {
    const investment = await this.DI.consumerInvestmentRepository.findOneOrFail({ id: investmentId });
    const user = await this.DI.userRepository.findOneOrFail({ id: investment.userId });

    // Calculate total returns
    const totalReturns = investment.consumerReturnAmount + investment.platformReturnAmount + investment.sharedReturnAmount;
    const totalValue = investment.consumerInvestmentAmount + totalReturns;

    // Update investment status
    wrap(investment).assign({
      status: 'completed',
      currentValue: totalValue,
      lastUpdated: new Date()
    });

    // Add returns to user's balance
    wrap(user).assign({
      availableBalance: user.availableBalance + totalReturns
    });

    // Create completion transaction
    const completionTransaction = new this.DI.transactionRepository.entity(
      'investment_completion',
      investment.userId,
      investment.itemId,
      totalReturns,
      `Investment completion for ${completionType}`,
      'completed'
    );

    completionTransaction.metadata = {
      investmentId: investment.id,
      completionType,
      consumerReturn: investment.consumerReturnAmount,
      platformReturn: investment.platformReturnAmount,
      sharedReturn: investment.sharedReturnAmount,
      totalInvestment: investment.consumerInvestmentAmount
    };

    // Update platform investment count
    await this.updatePlatformInvestment(0, -1);

    await this.DI.consumerInvestmentRepository.flush();
    await this.DI.transactionRepository.persistAndFlush(completionTransaction);
    await this.DI.userRepository.flush();

    return {
      investment,
      totalReturns,
      totalValue,
      completionType
    };
  }

  // Get user's consumer investment portfolio
  async getUserConsumerInvestmentPortfolio(userId) {
    const investments = await this.DI.consumerInvestmentRepository.find({
      userId
    });

    const portfolio = {
      activeInvestments: [],
      completedInvestments: [],
      totalInvested: 0,
      totalReturns: 0,
      totalValue: 0,
      summary: {
        activeCount: 0,
        completedCount: 0,
        averageReturnRate: 0
      }
    };

    let totalReturnRate = 0;
    let returnRateCount = 0;

    investments.forEach(investment => {
      const investmentData = {
        id: investment.id,
        itemId: investment.itemId,
        holdAmount: investment.holdAmount,
        consumerInvestment: investment.consumerInvestmentAmount,
        platformInvestment: investment.platformInvestmentAmount,
        currentValue: investment.currentValue,
        returnRate: investment.returnRate,
        consumerReturn: investment.consumerReturnAmount,
        platformReturn: investment.platformReturnAmount,
        sharedReturn: investment.sharedReturnAmount,
        status: investment.status,
        createdAt: investment.createdAt,
        lastUpdated: investment.lastUpdated,
        metadata: investment.metadata
      };

      if (investment.status === 'active') {
        portfolio.activeInvestments.push(investmentData);
        portfolio.summary.activeCount++;
      } else {
        portfolio.completedInvestments.push(investmentData);
        portfolio.summary.completedCount++;
      }

      portfolio.totalInvested += investment.consumerInvestmentAmount;
      portfolio.totalReturns += investment.consumerReturnAmount + investment.platformReturnAmount + investment.sharedReturnAmount;
      portfolio.totalValue += investment.currentValue;

      if (investment.returnRate > 0) {
        totalReturnRate += investment.returnRate;
        returnRateCount++;
      }
    });

    portfolio.summary.averageReturnRate = returnRateCount > 0 ? totalReturnRate / returnRateCount : 0;

    return portfolio;
  }

  // Get platform investment analytics
  async getPlatformInvestmentAnalytics() {
    const platformInvestment = await this.DI.platformInvestmentRepository.findOne({
      status: 'active'
    });

    const activeInvestments = await this.DI.consumerInvestmentRepository.find({
      status: 'active'
    });

    const analytics = {
      platformInvestment: platformInvestment || null,
      totalActiveHolds: activeInvestments.length,
      totalHoldValue: activeInvestments.reduce((sum, inv) => sum + inv.holdAmount, 0),
      totalConsumerInvestment: activeInvestments.reduce((sum, inv) => sum + inv.consumerInvestmentAmount, 0),
      totalPlatformInvestment: activeInvestments.reduce((sum, inv) => sum + inv.platformInvestmentAmount, 0),
      averageHoldAmount: activeInvestments.length > 0 ? 
        activeInvestments.reduce((sum, inv) => sum + inv.holdAmount, 0) / activeInvestments.length : 0,
      distributionHistory: platformInvestment?.metadata?.distributionHistory || []
    };

    return analytics;
  }
}

module.exports = { ConsumerInvestmentService }; 