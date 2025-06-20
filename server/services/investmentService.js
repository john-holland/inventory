const { wrap } = require("@mikro-orm/core");
const { WaterLimitService } = require("./waterLimitService");
const pLimit = require('p-limit');
const pBatch = require('p-batch');

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
    
    // Batch processing configuration
    this.batchConfig = {
      maxConcurrent: 5, // Maximum concurrent API calls
      batchSize: 10, // Number of investments to process in each batch
      delayBetweenBatches: 1000, // 1 second delay between batches
      retryAttempts: 3, // Number of retry attempts for failed requests
      retryDelay: 2000 // 2 seconds delay between retries
    };
    
    // Service fees for different investment types
    this.serviceFees = {
      crypto: 0.01, // 1% for cryptocurrency investments
      stocks: 0.005, // 0.5% for stock investments
      bonds: 0.003, // 0.3% for bond investments
      real_estate: 0.02 // 2% for real estate investments
    };
  }

  // Create a new investment for a user with service fee calculation
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
    
    // Calculate service fee
    const serviceFee = this.calculateServiceFee(amount, investmentType);
    const totalAmount = amount + serviceFee;
    
    if (user.availableBalance < totalAmount) {
      throw new Error(`Insufficient available balance. Required: $${totalAmount} (including $${serviceFee} service fee)`);
    }

    // Create investment record
    const investment = new this.DI.investmentRepository.entity(
      userId,
      amount,
      investmentType,
      service,
      'active'
    );

    // Deduct from user's available balance (including service fee)
    wrap(user).assign({
      availableBalance: user.availableBalance - totalAmount
    });

    // Create transaction record for investment
    const investmentTransaction = new this.DI.transactionRepository.entity(
      'investment',
      userId,
      null,
      -amount,
      `Investment in ${investmentType} via ${service}`,
      'completed'
    );

    investmentTransaction.referenceId = `INV_${Date.now()}`;
    investmentTransaction.metadata = {
      investmentType,
      service,
      serviceFee: 0 // Investment amount doesn't include service fee
    };

    // Create transaction record for service fee
    const serviceFeeTransaction = new this.DI.transactionRepository.entity(
      'service_fee',
      userId,
      null,
      -serviceFee,
      `Service fee for ${investmentType} investment via ${service}`,
      'completed'
    );

    serviceFeeTransaction.referenceId = `FEE_${Date.now()}`;
    serviceFeeTransaction.metadata = {
      feeType: 'investment_service_fee',
      investmentType,
      service,
      originalAmount: amount
    };

    // Add service fee to water limit
    await this.waterLimitService.addToWaterLimit(
      userId,
      serviceFee,
      'investment_service_fee',
      investment.id
    );

    await this.DI.investmentRepository.persistAndFlush(investment);
    await this.DI.transactionRepository.persistAndFlush(investmentTransaction);
    await this.DI.transactionRepository.persistAndFlush(serviceFeeTransaction);
    await this.DI.userRepository.flush();

    return {
      investment,
      serviceFee,
      totalAmount,
      note: `Service fee of $${serviceFee} (${(this.serviceFees[investmentType] * 100).toFixed(1)}%) applied to investment`
    };
  }

  // Update investment values with batched processing
  async updateInvestmentValues() {
    const activeInvestments = await this.DI.investmentRepository.find({
      status: 'active'
    });

    // Process investments in batches
    const limit = pLimit(this.batchConfig.maxConcurrent);
    const batches = this.createBatches(activeInvestments, this.batchConfig.batchSize);
    
    console.log(`Processing ${activeInvestments.length} investments in ${batches.length} batches`);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      console.log(`Processing batch ${i + 1}/${batches.length} with ${batch.length} investments`);

      // Process batch with concurrency limit
      const promises = batch.map(investment => 
        limit(() => this.processInvestmentUpdate(investment))
      );

      await Promise.all(promises);

      // Add delay between batches to avoid rate limiting
      if (i < batches.length - 1) {
        await this.delay(this.batchConfig.delayBetweenBatches);
      }
    }

    console.log('Investment value updates completed');
  }

  // Create batches from array
  createBatches(array, batchSize) {
    const batches = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }

  // Process individual investment update with retry logic
  async processInvestmentUpdate(investment) {
    let attempts = 0;
    
    while (attempts < this.batchConfig.retryAttempts) {
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
            returnRate: returnRate,
            batchProcessed: true
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
        return { success: true, investmentId: investment.id, newValue, returnAmount };
      } catch (error) {
        attempts++;
        console.error(`Failed to update investment ${investment.id} (attempt ${attempts}):`, error);
        
        if (attempts >= this.batchConfig.retryAttempts) {
          console.error(`Max retry attempts reached for investment ${investment.id}`);
          return { success: false, investmentId: investment.id, error: error.message };
        }
        
        // Wait before retrying
        await this.delay(this.batchConfig.retryDelay);
      }
    }
  }

  // Utility function for delays
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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
      waterLimitStatus: 'pending',
      note: `Liquidation completed. Funds will be released from water limit according to platform schedule.`
    };
  }

  // Get user's investment portfolio with service fee information
  async getUserPortfolio(userId) {
    const investments = await this.DI.investmentRepository.find({
      userId,
      status: 'active'
    });

    const totalInvested = investments.reduce((sum, inv) => sum + inv.amount, 0);
    const totalCurrentValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
    const totalReturn = totalCurrentValue - totalInvested;
    const totalReturnRate = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

    // Calculate total service fees paid
    const totalServiceFees = investments.reduce((sum, inv) => {
      const serviceFee = this.calculateServiceFee(inv.amount, inv.investmentType);
      return sum + serviceFee;
    }, 0);

    // Get water limit summary for investment returns
    const waterLimitSummary = await this.waterLimitService.getUserWaterLimitSummary(userId);

    return {
      investments,
      summary: {
        totalInvested,
        totalCurrentValue,
        totalReturn,
        totalReturnRate,
        totalServiceFees,
        netReturn: totalReturn - totalServiceFees
      },
      waterLimitSummary: {
        pendingReturns: waterLimitSummary.byType.investment_return?.pending || 0,
        releasedReturns: waterLimitSummary.byType.investment_return?.released || 0,
        totalReturns: waterLimitSummary.byType.investment_return?.total || 0
      },
      serviceFeeNote: `Total service fees paid: $${totalServiceFees.toFixed(2)}. Service fees vary by investment type: Crypto (1%), Stocks (0.5%), Bonds (0.3%), Real Estate (2%).`
    };
  }

  // Get investment performance with water limit information
  async getInvestmentPerformance(userId) {
    const investments = await this.DI.investmentRepository.find({
      userId
    });

    const waterLimitSummary = await this.waterLimitService.getUserWaterLimitSummary(userId);

    const performance = investments.map(inv => {
      const serviceFee = this.calculateServiceFee(inv.amount, inv.investmentType);
      const netReturn = inv.currentValue - inv.amount - serviceFee;
      const netReturnRate = inv.amount > 0 ? (netReturn / inv.amount) * 100 : 0;

      return {
        id: inv.id,
        investmentType: inv.investmentType,
        service: inv.service,
        amount: inv.amount,
        currentValue: inv.currentValue,
        returnRate: inv.returnRate,
        serviceFee,
        netReturn,
        netReturnRate,
        status: inv.status,
        createdAt: inv.createdAt,
        lastUpdated: inv.lastUpdated,
        waterLimitStatus: waterLimitSummary.details.find(w => w.investmentId === inv.id)?.status || 'none'
      };
    });

    return {
      performance,
      waterLimitSummary: {
        pendingReturns: waterLimitSummary.byType.investment_return?.pending || 0,
        releasedReturns: waterLimitSummary.byType.investment_return?.released || 0,
        totalReturns: waterLimitSummary.byType.investment_return?.total || 0
      }
    };
  }

  // Calculate service fee for investment
  calculateServiceFee(amount, investmentType) {
    const feeRate = this.serviceFees[investmentType];
    if (!feeRate) {
      throw new Error(`Unknown investment type: ${investmentType}`);
    }
    return amount * feeRate;
  }

  // Get service fee information
  getServiceFeeInfo() {
    return {
      fees: this.serviceFees,
      note: "Service fees are charged once at the time of investment and help cover platform costs, API integrations, and regulatory compliance."
    };
  }

  // Get batch processing statistics
  async getBatchProcessingStats() {
    const activeInvestments = await this.DI.investmentRepository.count({ status: 'active' });
    const totalBatches = Math.ceil(activeInvestments / this.batchConfig.batchSize);
    const estimatedProcessingTime = (totalBatches * this.batchConfig.delayBetweenBatches) / 1000;

    return {
      activeInvestments,
      batchSize: this.batchConfig.batchSize,
      maxConcurrent: this.batchConfig.maxConcurrent,
      totalBatches,
      estimatedProcessingTimeSeconds: estimatedProcessingTime,
      retryAttempts: this.batchConfig.retryAttempts
    };
  }
}

module.exports = { InvestmentService }; 