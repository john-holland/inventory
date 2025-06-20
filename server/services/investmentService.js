const { wrap } = require("@mikro-orm/core");
const { WaterLimitService } = require("./waterLimitService");

class InvestmentService {
  constructor(DI) {
    this.DI = DI;
    this.waterLimitService = new WaterLimitService(DI);
    this.supportedServices = {
      'crypto': ['coinbase', 'binance', 'kraken'],
      'stocks': ['robinhood', 'td_ameritrade', 'fidelity'],
      'bonds': ['vanguard', 'fidelity', 'schwab'],
      'real_estate': ['fundrise', 'realty_mogul']
    };
  }

  // Create a new investment for a user
  async createInvestment(userId, amount, investmentType, service) {
    // Validate investment parameters
    if (!this.supportedServices[investmentType]) {
      throw new Error(`Unsupported investment type: ${investmentType}`);
    }

    if (!this.supportedServices[investmentType].includes(service)) {
      throw new Error(`Unsupported service for ${investmentType}: ${service}`);
    }

    if (amount < 10) {
      throw new Error('Minimum investment amount is $10');
    }

    // Check if user has sufficient available balance
    const user = await this.DI.userRepository.findOneOrFail({ id: userId });
    if (user.availableBalance < amount) {
      throw new Error('Insufficient available balance');
    }

    // Create investment record
    const investment = new this.DI.investmentRepository.entity(
      userId,
      amount,
      investmentType,
      service,
      'active'
    );

    // Deduct from user's available balance
    wrap(user).assign({
      availableBalance: user.availableBalance - amount
    });

    // Create transaction record
    const transaction = new this.DI.transactionRepository.entity(
      'investment',
      userId,
      null,
      -amount,
      `Investment in ${investmentType} via ${service}`,
      'completed'
    );

    transaction.referenceId = `INV_${Date.now()}`;

    await this.DI.investmentRepository.persistAndFlush(investment);
    await this.DI.transactionRepository.persistAndFlush(transaction);
    await this.DI.userRepository.flush();

    return investment;
  }

  // Update investment values (called by cron job)
  async updateInvestmentValues() {
    const activeInvestments = await this.DI.investmentRepository.find({
      status: 'active'
    });

    for (const investment of activeInvestments) {
      try {
        const newValue = await this.calculateCurrentValue(investment);
        const returnAmount = newValue - investment.amount;
        const returnRate = (returnAmount / investment.amount) * 100;

        // Only process returns if there's a positive return
        if (returnAmount > 0) {
          // Add investment returns to water limit instead of directly to user
          await this.waterLimitService.addToWaterLimit(
            investment.userId,
            returnAmount,
            'investment_return',
            investment.id
          );

          // Update investment with new value but don't liquidate
          wrap(investment).assign({
            currentValue: newValue,
            returnRate,
            lastUpdated: new Date()
          });

          // Create transaction record for the return (in water limit)
          const returnTransaction = new this.DI.transactionRepository.entity(
            'investment_return',
            investment.userId,
            investment.id,
            returnAmount,
            `Investment return for ${investment.investmentType} via ${investment.service}`,
            'completed'
          );

          returnTransaction.metadata = {
            waterLimitType: 'investment_return',
            returnRate: returnRate
          };

          await this.DI.transactionRepository.persistAndFlush(returnTransaction);
        } else {
          // Update investment value even if no return
          wrap(investment).assign({
            currentValue: newValue,
            returnRate,
            lastUpdated: new Date()
          });
        }

        await this.DI.investmentRepository.flush();
      } catch (error) {
        console.error(`Failed to update investment ${investment.id}:`, error);
      }
    }
  }

  // Calculate current value of investment (simplified - would integrate with real APIs)
  async calculateCurrentValue(investment) {
    // This is a simplified calculation - in production, you'd integrate with real APIs
    const baseReturn = {
      'crypto': 0.05, // 5% average return
      'stocks': 0.08, // 8% average return
      'bonds': 0.03, // 3% average return
      'real_estate': 0.06 // 6% average return
    };

    const daysSinceCreation = (Date.now() - investment.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    const annualReturn = baseReturn[investment.investmentType] || 0.05;
    const dailyReturn = annualReturn / 365;
    
    return investment.amount * Math.pow(1 + dailyReturn, daysSinceCreation);
  }

  // Liquidate investment and return funds to user (through water limit)
  async liquidateInvestment(investmentId) {
    const investment = await this.DI.investmentRepository.findOneOrFail({ id: investmentId });
    
    if (investment.status !== 'active') {
      throw new Error('Investment is not active');
    }

    const user = await this.DI.userRepository.findOneOrFail({ id: investment.userId });
    
    // Update investment status
    wrap(investment).assign({
      status: 'completed'
    });

    // Calculate total return (original amount + current value)
    const totalReturn = investment.currentValue;
    const returnAmount = totalReturn - investment.amount;

    // Add the total return to water limit
    await this.waterLimitService.addToWaterLimit(
      investment.userId,
      totalReturn,
      'investment_return',
      investment.id
    );

    // Create liquidation transaction
    const liquidationTransaction = new this.DI.transactionRepository.entity(
      'investment_liquidation',
      investment.userId,
      investment.id,
      totalReturn,
      `Investment liquidation from ${investment.investmentType} via ${investment.service}`,
      'completed'
    );

    liquidationTransaction.metadata = {
      waterLimitType: 'investment_return',
      originalAmount: investment.amount,
      returnAmount: returnAmount,
      returnRate: investment.returnRate
    };

    await this.DI.investmentRepository.flush();
    await this.DI.transactionRepository.persistAndFlush(liquidationTransaction);

    return {
      investment,
      totalReturn,
      returnAmount,
      returnRate: investment.returnRate,
      waterLimitStatus: 'pending'
    };
  }

  // Get user's investment portfolio
  async getUserPortfolio(userId) {
    const investments = await this.DI.investmentRepository.find({
      userId,
      status: 'active'
    });

    const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
    const totalCurrentValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
    const totalReturn = totalCurrentValue - totalInvested;
    const totalReturnRate = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

    // Get water limit summary for investment returns
    const waterLimitSummary = await this.waterLimitService.getUserWaterLimitSummary(userId);

    return {
      investments,
      summary: {
        totalInvested,
        totalCurrentValue,
        totalReturn,
        totalReturnRate
      },
      waterLimitSummary: {
        pendingReturns: waterLimitSummary.byType.investment_return?.pending || 0,
        releasedReturns: waterLimitSummary.byType.investment_return?.released || 0,
        totalReturns: waterLimitSummary.byType.investment_return?.total || 0
      }
    };
  }

  // Get investment performance with water limit information
  async getInvestmentPerformance(userId) {
    const investments = await this.DI.investmentRepository.find({
      userId
    });

    const waterLimitSummary = await this.waterLimitService.getUserWaterLimitSummary(userId);

    const performance = investments.map(inv => ({
      id: inv.id,
      investmentType: inv.investmentType,
      service: inv.service,
      amount: inv.amount,
      currentValue: inv.currentValue,
      returnRate: inv.returnRate,
      status: inv.status,
      createdAt: inv.createdAt,
      lastUpdated: inv.lastUpdated,
      waterLimitStatus: waterLimitSummary.details.find(w => w.investmentId === inv.id)?.status || 'none'
    }));

    return {
      performance,
      waterLimitSummary: {
        pendingReturns: waterLimitSummary.byType.investment_return?.pending || 0,
        releasedReturns: waterLimitSummary.byType.investment_return?.released || 0,
        totalReturns: waterLimitSummary.byType.investment_return?.total || 0
      }
    };
  }
}

module.exports = { InvestmentService }; 