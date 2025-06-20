I’m "use strict";

const { getCoefficient } = require('../config/ConstantMarketCoefficients');

class InvestmentPoolService {
  constructor(em) {
    this.em = em;
  }

  /**
   * Create a new investment pool for a user
   */
  async createPool(userId, poolType, initialAmount = 0, settings = {}) {
    try {
      const poolRepo = this.em.getRepository('InvestmentPool');
      const userRepo = this.em.getRepository('User');
      
      // Validate user exists
      const user = await userRepo.findOne({ id: userId });
      if (!user) {
        throw new Error('User not found');
      }

      // Validate pool type
      const validTypes = getCoefficient('INVESTMENT.POOL.TYPES');
      if (!Object.values(validTypes).includes(poolType)) {
        throw new Error('Invalid pool type');
      }

      // Check if user already has a pool of this type
      const existingPool = await poolRepo.findOne({ 
        userId: userId, 
        poolType: poolType,
        isActive: true 
      });
      
      if (existingPool) {
        throw new Error(`User already has an active ${poolType} pool`);
      }

      // Create pool
      const pool = new (await this.em.getEntity('InvestmentPool'))(
        userId,
        poolType,
        initialAmount
      );

      // Set pool-specific settings
      if (poolType === 'individual') {
        const individualSettings = getCoefficient('INVESTMENT.POOL.INDIVIDUAL');
        pool.minBalance = settings.minBalance || individualSettings.MIN_BALANCE;
        pool.maxBalance = settings.maxBalance || individualSettings.MAX_BALANCE;
        pool.expectedReturnRate = individualSettings.DEFAULT_RETURN_RATE;
        pool.metadata.riskProfile = settings.riskProfile || individualSettings.RISK_PROFILE;
      } else if (poolType === 'herd') {
        const herdSettings = getCoefficient('INVESTMENT.POOL.HERD');
        pool.expectedReturnRate = herdSettings.BASE_RETURN_RATE;
        pool.metadata.investmentStrategy = 'herd_participation';
      } else if (poolType === 'automatic') {
        const autoSettings = getCoefficient('INVESTMENT.POOL.AUTOMATIC');
        pool.autoModeSettings = {
          ...autoSettings,
          ...settings.autoModeSettings
        };
        pool.expectedReturnRate = getCoefficient('INVESTMENT.POOL.INDIVIDUAL.DEFAULT_RETURN_RATE');
      }

      // Set additional settings
      if (settings.targetBalance) pool.targetBalance = settings.targetBalance;
      if (settings.autoReinvest !== undefined) pool.autoReinvest = settings.autoReinvest;
      if (settings.metadata) {
        pool.metadata = { ...pool.metadata, ...settings.metadata };
      }

      await this.em.persistAndFlush(pool);

      // Create audit log
      await this.createAuditLog('pool_created', {
        poolId: pool.id,
        userId: userId,
        poolType: poolType,
        initialAmount: initialAmount,
        settings: settings
      });

      return pool;
    } catch (error) {
      console.error('Error creating investment pool:', error);
      throw error;
    }
  }

  /**
   * Add funds to an investment pool
   */
  async addFunds(poolId, amount, source = 'wallet') {
    try {
      const poolRepo = this.em.getRepository('InvestmentPool');
      
      const pool = await poolRepo.findOne({ id: poolId });
      if (!pool || !pool.isActive) {
        throw new Error('Pool not found or inactive');
      }

      // Validate amount
      const minInvestment = getCoefficient('INVESTMENT.LIMITS.MIN_INVESTMENT');
      if (amount < minInvestment) {
        throw new Error(`Minimum investment amount is $${minInvestment}`);
      }

      // Check pool limits
      if (pool.poolType === 'individual') {
        const maxBalance = getCoefficient('INVESTMENT.POOL.INDIVIDUAL.MAX_BALANCE');
        if (pool.currentBalance + amount > maxBalance) {
          throw new Error(`Maximum balance for individual pool is $${maxBalance}`);
        }
      } else if (pool.poolType === 'herd') {
        const maxContribution = getCoefficient('INVESTMENT.POOL.HERD.MAX_CONTRIBUTION');
        if (pool.herdContribution + amount > maxContribution) {
          throw new Error(`Maximum herd contribution is $${maxContribution}`);
        }
      }

      // Update pool
      pool.currentBalance += amount;
      pool.totalInvested += amount;
      pool.totalTransactions += 1;
      pool.lastTransactionDate = new Date();

      if (pool.poolType === 'herd') {
        pool.herdContribution += amount;
      }

      // Update performance history
      pool.performanceHistory.push({
        date: new Date(),
        action: 'add_funds',
        amount: amount,
        balance: pool.currentBalance,
        returnRate: pool.averageReturnRate
      });

      // Keep only recent history
      const historyLength = getCoefficient('INVESTMENT.POOL.PERFORMANCE.HISTORY_LENGTH');
      if (pool.performanceHistory.length > historyLength) {
        pool.performanceHistory = pool.performanceHistory.slice(-historyLength);
      }

      await this.em.persistAndFlush(pool);

      // Create audit log
      await this.createAuditLog('funds_added', {
        poolId: poolId,
        amount: amount,
        source: source,
        newBalance: pool.currentBalance
      });

      return pool;
    } catch (error) {
      console.error('Error adding funds to pool:', error);
      throw error;
    }
  }

  /**
   * Calculate returns for an investment pool
   */
  async calculateReturns(poolId) {
    try {
      const poolRepo = this.em.getRepository('InvestmentPool');
      
      const pool = await poolRepo.findOne({ id: poolId });
      if (!pool || !pool.isActive) {
        throw new Error('Pool not found or inactive');
      }

      let returnRate = pool.expectedReturnRate;
      let returnAmount = 0;

      // Calculate returns based on pool type
      if (pool.poolType === 'individual') {
        returnAmount = pool.currentBalance * returnRate;
      } else if (pool.poolType === 'herd') {
        // Herd returns are calculated based on herd performance
        const herdPerformance = await this.getHerdPerformance();
        returnRate = herdPerformance.averageReturnRate;
        returnAmount = pool.herdContribution * returnRate * pool.herdReturnShare;
      } else if (pool.poolType === 'automatic') {
        // Automatic mode uses weighted average of individual and herd returns
        const herdPerformance = await this.getHerdPerformance();
        const individualRate = getCoefficient('INVESTMENT.POOL.INDIVIDUAL.DEFAULT_RETURN_RATE');
        const herdRate = herdPerformance.averageReturnRate;
        
        // Weight based on current allocation
        const individualWeight = 1 - pool.herdParticipation;
        returnRate = (individualRate * individualWeight) + (herdRate * pool.herdParticipation);
        returnAmount = pool.currentBalance * returnRate;
      }

      // Apply performance bonuses
      const benchmarkRate = getCoefficient('INVESTMENT.POOL.PERFORMANCE.BENCHMARK_RATE');
      if (returnRate > benchmarkRate) {
        const outperformanceBonus = getCoefficient('INVESTMENT.POOL.PERFORMANCE.OUTPERFORMANCE_BONUS');
        returnAmount += pool.currentBalance * outperformanceBonus;
      }

      return {
        poolId: poolId,
        returnRate: returnRate,
        returnAmount: Math.round(returnAmount * 100) / 100,
        currentBalance: pool.currentBalance,
        poolType: pool.poolType
      };
    } catch (error) {
      console.error('Error calculating returns:', error);
      throw error;
    }
  }

  /**
   * Distribute returns to pool
   */
  async distributeReturns(poolId, returnAmount) {
    try {
      const poolRepo = this.em.getRepository('InvestmentPool');
      
      const pool = await poolRepo.findOne({ id: poolId });
      if (!pool || !pool.isActive) {
        throw new Error('Pool not found or inactive');
      }

      // Update pool
      pool.currentBalance += returnAmount;
      pool.totalReturns += returnAmount;
      pool.totalTransactions += 1;
      pool.lastTransactionDate = new Date();

      // Update average return rate
      const totalInvested = pool.totalInvested || 1;
      pool.averageReturnRate = pool.totalReturns / totalInvested;

      // Update performance history
      pool.performanceHistory.push({
        date: new Date(),
        action: 'returns_distributed',
        amount: returnAmount,
        balance: pool.currentBalance,
        returnRate: pool.averageReturnRate
      });

      // Keep only recent history
      const historyLength = getCoefficient('INVESTMENT.POOL.PERFORMANCE.HISTORY_LENGTH');
      if (pool.performanceHistory.length > historyLength) {
        pool.performanceHistory = pool.performanceHistory.slice(-historyLength);
      }

      await this.em.persistAndFlush(pool);

      // Create audit log
      await this.createAuditLog('returns_distributed', {
        poolId: poolId,
        returnAmount: returnAmount,
        newBalance: pool.currentBalance,
        averageReturnRate: pool.averageReturnRate
      });

      return pool;
    } catch (error) {
      console.error('Error distributing returns:', error);
      throw error;
    }
  }

  /**
   * Get herd performance statistics
   */
  async getHerdPerformance() {
    try {
      const poolRepo = this.em.getRepository('InvestmentPool');
      
      const herdPools = await poolRepo.find({ 
        poolType: 'herd',
        isActive: true 
      });

      if (herdPools.length === 0) {
        return {
          totalContributions: 0,
          averageReturnRate: getCoefficient('INVESTMENT.POOL.HERD.BASE_RETURN_RATE'),
          totalReturns: 0,
          participantCount: 0
        };
      }

      const totalContributions = herdPools.reduce((sum, pool) => sum + parseFloat(pool.herdContribution), 0);
      const totalReturns = herdPools.reduce((sum, pool) => sum + parseFloat(pool.totalReturns), 0);
      const averageReturnRate = totalContributions > 0 ? totalReturns / totalContributions : 0;

      return {
        totalContributions: Math.round(totalContributions * 100) / 100,
        averageReturnRate: Math.round(averageReturnRate * 10000) / 10000,
        totalReturns: Math.round(totalReturns * 100) / 100,
        participantCount: herdPools.length
      };
    } catch (error) {
      console.error('Error getting herd performance:', error);
      throw error;
    }
  }

  /**
   * Process automatic mode rebalancing
   */
  async processAutomaticRebalancing() {
    try {
      const poolRepo = this.em.getRepository('InvestmentPool');
      const waterLimitService = this.em.getRepository('WaterLimit');
      
      const autoPools = await poolRepo.find({ 
        poolType: 'automatic',
        isActive: true 
      });

      let processedCount = 0;

      for (const pool of autoPools) {
        try {
          // Get current water level
          const waterLevel = await this.getCurrentWaterLevel();
          
          const autoSettings = pool.autoModeSettings;
          const herdThreshold = autoSettings.herdThreshold || 0.7;
          const individualThreshold = autoSettings.individualThreshold || 0.3;
          const maxRebalance = autoSettings.maxRebalanceAmount || 0.2;

          let targetHerdParticipation = pool.herdParticipation;

          // Determine target allocation based on water level
          if (waterLevel >= herdThreshold) {
            targetHerdParticipation = 1.0; // 100% herd
          } else if (waterLevel <= individualThreshold) {
            targetHerdParticipation = 0.0; // 100% individual
          } else {
            // Linear interpolation between thresholds
            const range = herdThreshold - individualThreshold;
            const position = (waterLevel - individualThreshold) / range;
            targetHerdParticipation = position;
          }

          // Calculate rebalance amount
          const currentHerdAmount = pool.currentBalance * pool.herdParticipation;
          const targetHerdAmount = pool.currentBalance * targetHerdParticipation;
          const rebalanceAmount = targetHerdAmount - currentHerdAmount;

          // Limit rebalance amount
          const maxAmount = pool.currentBalance * maxRebalance;
          const actualRebalanceAmount = Math.max(-maxAmount, Math.min(maxAmount, rebalanceAmount));

          if (Math.abs(actualRebalanceAmount) > 0.01) { // Only rebalance if amount is significant
            // Update herd participation
            pool.herdParticipation = targetHerdParticipation;
            pool.herdContribution += actualRebalanceAmount;
            
            // Update performance history
            pool.performanceHistory.push({
              date: new Date(),
              action: 'automatic_rebalance',
              waterLevel: waterLevel,
              rebalanceAmount: actualRebalanceAmount,
              newHerdParticipation: targetHerdParticipation
            });

            await this.em.persistAndFlush(pool);
            processedCount++;
          }
        } catch (error) {
          console.error(`Error processing automatic rebalancing for pool ${pool.id}:`, error);
        }
      }

      return {
        processed: processedCount,
        total: autoPools.length
      };
    } catch (error) {
      console.error('Error processing automatic rebalancing:', error);
      throw error;
    }
  }

  /**
   * Get current water level
   */
  async getCurrentWaterLevel() {
    try {
      // This would integrate with the water level service
      // For now, return a default value
      return 0.5; // 50% water level
    } catch (error) {
      console.error('Error getting current water level:', error);
      return 0.5;
    }
  }

  /**
   * Get pool statistics
   */
  async getPoolStatistics() {
    try {
      const poolRepo = this.em.getRepository('InvestmentPool');
      
      const allPools = await poolRepo.find({ isActive: true });
      
      const stats = {
        totalPools: allPools.length,
        individualPools: 0,
        herdPools: 0,
        automaticPools: 0,
        totalInvested: 0,
        totalReturns: 0,
        averageReturnRate: 0
      };

      for (const pool of allPools) {
        stats.totalInvested += parseFloat(pool.totalInvested);
        stats.totalReturns += parseFloat(pool.totalReturns);
        
        if (pool.poolType === 'individual') stats.individualPools++;
        else if (pool.poolType === 'herd') stats.herdPools++;
        else if (pool.poolType === 'automatic') stats.automaticPools++;
      }

      stats.totalInvested = Math.round(stats.totalInvested * 100) / 100;
      stats.totalReturns = Math.round(stats.totalReturns * 100) / 100;
      stats.averageReturnRate = stats.totalInvested > 0 ? stats.totalReturns / stats.totalInvested : 0;

      return stats;
    } catch (error) {
      console.error('Error getting pool statistics:', error);
      throw error;
    }
  }

  /**
   * Create audit log entry
   */
  async createAuditLog(action, data) {
    try {
      console.log(`INVESTMENT POOL AUDIT LOG [${action}]:`, {
        timestamp: new Date(),
        action,
        data
      });
    } catch (error) {
      console.error('Error creating audit log:', error);
    }
  }
}

module.exports = { InvestmentPoolService }; 