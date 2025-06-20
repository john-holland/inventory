const { wrap } = require("@mikro-orm/core");

class WaterLimitService {
  constructor(DI) {
    this.DI = DI;
    this.waterLimitConfig = {
      investment_return: {
        threshold: 50, // $50 minimum before release
        holdPeriod: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
        maxHoldAmount: 1000 // $1000 maximum in water limit
      },
      hold_stagnation: {
        threshold: 25, // $25 minimum before release
        holdPeriod: 3 * 24 * 60 * 60 * 1000, // 3 days in milliseconds
        maxHoldAmount: 500 // $500 maximum in water limit
      },
      energy_efficiency: {
        threshold: 10, // $10 minimum before release
        holdPeriod: 1 * 24 * 60 * 60 * 1000, // 1 day in milliseconds
        maxHoldAmount: 200 // $200 maximum in water limit
      }
    };
  }

  // Add funds to water limit
  async addToWaterLimit(userId, amount, type, investmentId = null) {
    const config = this.waterLimitConfig[type];
    if (!config) {
      throw new Error(`Unknown water limit type: ${type}`);
    }

    // Check if user already has a water limit for this type
    let waterLimit = await this.DI.waterLimitRepository.findOne({
      userId,
      type,
      status: 'pending'
    });

    if (waterLimit) {
      // Update existing water limit
      const newBalance = waterLimit.currentBalance + amount;
      
      // Check if exceeding max hold amount
      if (newBalance > config.maxHoldAmount) {
        const excessAmount = newBalance - config.maxHoldAmount;
        const amountToAdd = amount - excessAmount;
        
        wrap(waterLimit).assign({
          currentBalance: config.maxHoldAmount,
          lastUpdated: new Date()
        });

        // Create transaction for the excess amount (immediate release)
        const excessTransaction = new this.DI.transactionRepository.entity(
          'water_limit_release',
          userId,
          investmentId,
          excessAmount,
          `Water limit excess release for ${type}`,
          'completed'
        );

        await this.DI.transactionRepository.persistAndFlush(excessTransaction);
      } else {
        wrap(waterLimit).assign({
          currentBalance: newBalance,
          lastUpdated: new Date()
        });
      }
    } else {
      // Create new water limit
      const releaseDate = new Date(Date.now() + config.holdPeriod);
      
      waterLimit = new this.DI.waterLimitRepository.entity(
        userId,
        investmentId,
        amount,
        type,
        'pending'
      );

      waterLimit.releaseThreshold = config.threshold;
      waterLimit.currentBalance = Math.min(amount, config.maxHoldAmount);
      waterLimit.releaseDate = releaseDate;
      waterLimit.metadata = {
        originalAmount: amount,
        config: config
      };

      await this.DI.waterLimitRepository.persistAndFlush(waterLimit);
    }

    await this.DI.waterLimitRepository.flush();

    return waterLimit;
  }

  // Check if water limit can be released
  async checkWaterLimitRelease(waterLimitId) {
    const waterLimit = await this.DI.waterLimitRepository.findOneOrFail({ id: waterLimitId });
    
    if (waterLimit.status !== 'pending') {
      return { canRelease: false, reason: 'Already processed' };
    }

    const config = this.waterLimitConfig[waterLimit.type];
    const now = new Date();

    // Check if hold period has passed
    if (waterLimit.releaseDate && now < waterLimit.releaseDate) {
      return { 
        canRelease: false, 
        reason: 'Hold period not completed',
        remainingTime: waterLimit.releaseDate.getTime() - now.getTime()
      };
    }

    // Check if threshold is met
    if (waterLimit.currentBalance < waterLimit.releaseThreshold) {
      return { 
        canRelease: false, 
        reason: 'Threshold not met',
        currentBalance: waterLimit.currentBalance,
        threshold: waterLimit.releaseThreshold
      };
    }

    return { canRelease: true };
  }

  // Release water limit funds to user
  async releaseWaterLimit(waterLimitId) {
    const waterLimit = await this.DI.waterLimitRepository.findOneOrFail({ id: waterLimitId });
    const user = await this.DI.userRepository.findOneOrFail({ id: waterLimit.userId });

    const releaseCheck = await this.checkWaterLimitRelease(waterLimitId);
    if (!releaseCheck.canRelease) {
      throw new Error(`Cannot release water limit: ${releaseCheck.reason}`);
    }

    const releaseAmount = waterLimit.currentBalance;

    // Update water limit status
    wrap(waterLimit).assign({
      status: 'released',
      currentBalance: 0,
      lastUpdated: new Date()
    });

    // Add funds to user's available balance
    wrap(user).assign({
      availableBalance: user.availableBalance + releaseAmount
    });

    // Create release transaction
    const releaseTransaction = new this.DI.transactionRepository.entity(
      'water_limit_release',
      waterLimit.userId,
      waterLimit.investmentId,
      releaseAmount,
      `Water limit release for ${waterLimit.type}`,
      'completed'
    );

    releaseTransaction.metadata = {
      waterLimitId: waterLimit.id,
      originalAmount: waterLimit.amount,
      holdDuration: Date.now() - waterLimit.createdAt.getTime()
    };

    await this.DI.transactionRepository.persistAndFlush(releaseTransaction);
    await this.DI.waterLimitRepository.flush();
    await this.DI.userRepository.flush();

    return {
      waterLimit,
      releaseAmount,
      userNewBalance: user.availableBalance + releaseAmount
    };
  }

  // Process all eligible water limit releases
  async processWaterLimitReleases() {
    const pendingWaterLimits = await this.DI.waterLimitRepository.find({
      status: 'pending'
    });

    const results = {
      processed: 0,
      released: 0,
      totalReleased: 0,
      errors: []
    };

    for (const waterLimit of pendingWaterLimits) {
      try {
        const releaseCheck = await this.checkWaterLimitRelease(waterLimit.id);
        
        if (releaseCheck.canRelease) {
          const releaseResult = await this.releaseWaterLimit(waterLimit.id);
          results.released++;
          results.totalReleased += releaseResult.releaseAmount;
        }
        
        results.processed++;
      } catch (error) {
        results.errors.push({
          waterLimitId: waterLimit.id,
          error: error.message
        });
      }
    }

    return results;
  }

  // Get user's water limit summary
  async getUserWaterLimitSummary(userId) {
    const waterLimits = await this.DI.waterLimitRepository.find({
      userId
    });

    const summary = {
      totalPending: 0,
      totalReleased: 0,
      byType: {},
      details: waterLimits
    };

    waterLimits.forEach(limit => {
      if (!summary.byType[limit.type]) {
        summary.byType[limit.type] = {
          pending: 0,
          released: 0,
          total: 0
        };
      }

      if (limit.status === 'pending') {
        summary.totalPending += limit.currentBalance;
        summary.byType[limit.type].pending += limit.currentBalance;
      } else if (limit.status === 'released') {
        summary.totalReleased += limit.amount;
        summary.byType[limit.type].released += limit.amount;
      }

      summary.byType[limit.type].total += limit.amount;
    });

    return summary;
  }

  // Get water limit analytics
  async getWaterLimitAnalytics() {
    const waterLimits = await this.DI.waterLimitRepository.find({});

    const analytics = {
      totalWaterLimits: waterLimits.length,
      totalPendingAmount: 0,
      totalReleasedAmount: 0,
      byType: {},
      averageHoldTime: 0,
      releaseRate: 0
    };

    let totalHoldTime = 0;
    let releasedCount = 0;

    waterLimits.forEach(limit => {
      if (!analytics.byType[limit.type]) {
        analytics.byType[limit.type] = {
          count: 0,
          pendingAmount: 0,
          releasedAmount: 0,
          averageHoldTime: 0
        };
      }

      analytics.byType[limit.type].count++;

      if (limit.status === 'pending') {
        analytics.totalPendingAmount += limit.currentBalance;
        analytics.byType[limit.type].pendingAmount += limit.currentBalance;
      } else if (limit.status === 'released') {
        analytics.totalReleasedAmount += limit.amount;
        analytics.byType[limit.type].releasedAmount += limit.amount;
        releasedCount++;
        
        const holdTime = limit.lastUpdated.getTime() - limit.createdAt.getTime();
        totalHoldTime += holdTime;
        analytics.byType[limit.type].averageHoldTime += holdTime;
      }
    });

    // Calculate averages
    if (releasedCount > 0) {
      analytics.averageHoldTime = totalHoldTime / releasedCount;
      analytics.releaseRate = (releasedCount / waterLimits.length) * 100;
    }

    // Calculate type-specific averages
    Object.keys(analytics.byType).forEach(type => {
      const typeData = analytics.byType[type];
      const releasedInType = waterLimits.filter(w => w.type === type && w.status === 'released').length;
      if (releasedInType > 0) {
        typeData.averageHoldTime = typeData.averageHoldTime / releasedInType;
      }
    });

    return analytics;
  }

  // Cancel water limit (for refunds or errors)
  async cancelWaterLimit(waterLimitId, reason) {
    const waterLimit = await this.DI.waterLimitRepository.findOneOrFail({ id: waterLimitId });
    
    if (waterLimit.status !== 'pending') {
      throw new Error('Cannot cancel non-pending water limit');
    }

    wrap(waterLimit).assign({
      status: 'cancelled',
      lastUpdated: new Date()
    });

    waterLimit.metadata.cancellationReason = reason;
    waterLimit.metadata.cancelledAt = new Date();

    await this.DI.waterLimitRepository.flush();

    return waterLimit;
  }
}

module.exports = { WaterLimitService }; 