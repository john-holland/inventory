const { wrap } = require("@mikro-orm/core");
const { WaterLimitService } = require("./waterLimitService");

class TaxService {
  constructor(DI) {
    this.DI = DI;
    this.waterLimitService = new WaterLimitService(DI);
    
    // US Federal Tax Rates (2024)
    this.federalTaxRates = {
      single: [
        { min: 0, max: 11600, rate: 0.10 },
        { min: 11601, max: 47150, rate: 0.12 },
        { min: 47151, max: 100525, rate: 0.22 },
        { min: 100526, max: 191950, rate: 0.24 },
        { min: 191951, max: 243725, rate: 0.32 },
        { min: 243726, max: 609350, rate: 0.35 },
        { min: 609351, max: Infinity, rate: 0.37 }
      ],
      married: [
        { min: 0, max: 23200, rate: 0.10 },
        { min: 23201, max: 94300, rate: 0.12 },
        { min: 94301, max: 201050, rate: 0.22 },
        { min: 201051, max: 383900, rate: 0.24 },
        { min: 383901, max: 487450, rate: 0.32 },
        { min: 487451, max: 731200, rate: 0.35 },
        { min: 731201, max: Infinity, rate: 0.37 }
      ]
    };

    // US State Tax Rates (simplified - would need full state-by-state data)
    this.stateTaxRates = {
      'CA': { rate: 0.075, name: 'California' },
      'NY': { rate: 0.0685, name: 'New York' },
      'TX': { rate: 0.0625, name: 'Texas' },
      'FL': { rate: 0.06, name: 'Florida' },
      'WA': { rate: 0.065, name: 'Washington' },
      'IL': { rate: 0.0625, name: 'Illinois' },
      'PA': { rate: 0.0625, name: 'Pennsylvania' },
      'OH': { rate: 0.0575, name: 'Ohio' },
      'GA': { rate: 0.06, name: 'Georgia' },
      'NC': { rate: 0.0475, name: 'North Carolina' }
    };

    // VAT Rates by Country (EU and others)
    this.vatRates = {
      'DE': { rate: 0.19, name: 'Germany' },
      'FR': { rate: 0.20, name: 'France' },
      'GB': { rate: 0.20, name: 'United Kingdom' },
      'IT': { rate: 0.22, name: 'Italy' },
      'ES': { rate: 0.21, name: 'Spain' },
      'NL': { rate: 0.21, name: 'Netherlands' },
      'BE': { rate: 0.21, name: 'Belgium' },
      'AT': { rate: 0.20, name: 'Austria' },
      'SE': { rate: 0.25, name: 'Sweden' },
      'DK': { rate: 0.25, name: 'Denmark' },
      'FI': { rate: 0.24, name: 'Finland' },
      'IE': { rate: 0.23, name: 'Ireland' },
      'PT': { rate: 0.23, name: 'Portugal' },
      'PL': { rate: 0.23, name: 'Poland' },
      'CZ': { rate: 0.21, name: 'Czech Republic' },
      'HU': { rate: 0.27, name: 'Hungary' },
      'RO': { rate: 0.19, name: 'Romania' },
      'BG': { rate: 0.20, name: 'Bulgaria' },
      'HR': { rate: 0.25, name: 'Croatia' },
      'SI': { rate: 0.22, name: 'Slovenia' },
      'SK': { rate: 0.20, name: 'Slovakia' },
      'LT': { rate: 0.21, name: 'Lithuania' },
      'LV': { rate: 0.21, name: 'Latvia' },
      'EE': { rate: 0.20, name: 'Estonia' },
      'CY': { rate: 0.19, name: 'Cyprus' },
      'MT': { rate: 0.18, name: 'Malta' },
      'LU': { rate: 0.17, name: 'Luxembourg' }
    };

    // Tax categories for different types of income
    this.taxCategories = {
      'investment_return': 'Capital Gains',
      'hold_stagnation': 'Other Income',
      'energy_efficiency': 'Other Income',
      'crypto_service_fee': 'Service Income',
      'investment_service_fee': 'Service Income',
      'platform_fee': 'Service Income',
      'shipping_fee': 'Service Income'
    };
  }

  // Calculate US Federal Income Tax
  calculateFederalTax(income, filingStatus = 'single') {
    const brackets = this.federalTaxRates[filingStatus] || this.federalTaxRates.single;
    let totalTax = 0;
    let remainingIncome = income;

    for (const bracket of brackets) {
      if (remainingIncome <= 0) break;
      
      const taxableInBracket = Math.min(
        remainingIncome,
        bracket.max === Infinity ? remainingIncome : bracket.max - bracket.min + 1
      );
      
      totalTax += taxableInBracket * bracket.rate;
      remainingIncome -= taxableInBracket;
    }

    return {
      totalTax,
      effectiveRate: income > 0 ? totalTax / income : 0,
      brackets: brackets.map(bracket => ({
        ...bracket,
        taxInBracket: Math.min(
          Math.max(0, income - bracket.min),
          bracket.max === Infinity ? income : bracket.max - bracket.min + 1
        ) * bracket.rate
      }))
    };
  }

  // Calculate US State Income Tax
  calculateStateTax(income, stateCode) {
    const stateInfo = this.stateTaxRates[stateCode];
    if (!stateInfo) {
      return { totalTax: 0, rate: 0, stateName: 'Unknown' };
    }

    const totalTax = income * stateInfo.rate;
    return {
      totalTax,
      rate: stateInfo.rate,
      stateName: stateInfo.name,
      effectiveRate: stateInfo.rate
    };
  }

  // Calculate VAT
  calculateVAT(amount, countryCode) {
    const vatInfo = this.vatRates[countryCode];
    if (!vatInfo) {
      return { vatAmount: 0, rate: 0, countryName: 'Unknown' };
    }

    const vatAmount = amount * vatInfo.rate;
    return {
      vatAmount,
      rate: vatInfo.rate,
      countryName: vatInfo.name,
      netAmount: amount - vatAmount
    };
  }

  // Get consumer tax information for a specific user
  async getConsumerTaxInfo(userId, taxYear) {
    try {
      // Get user information
      const user = await this.DI.userRepository.findOneOrFail({ id: userId });
      
      // Get all transactions for the tax year
      const startDate = new Date(taxYear, 0, 1);
      const endDate = new Date(taxYear, 11, 31, 23, 59, 59);

      const transactions = await this.DI.transactionRepository.find({
        userId,
        createdAt: {
          $gte: startDate,
          $lte: endDate
        },
        status: 'completed'
      });

      // Get water limit releases for the tax year
      const waterLimitReleases = await this.DI.waterLimitRepository.find({
        userId,
        releasedAt: {
          $gte: startDate,
          $lte: endDate
        },
        status: 'released'
      });

      // Calculate income by category
      const incomeByCategory = {};
      let totalIncome = 0;

      // Process transactions
      transactions.forEach(transaction => {
        if (transaction.amount > 0) { // Positive amounts are income
          const category = this.taxCategories[transaction.metadata?.waterLimitType] || 'Other Income';
          if (!incomeByCategory[category]) {
            incomeByCategory[category] = 0;
          }
          incomeByCategory[category] += transaction.amount;
          totalIncome += transaction.amount;
        }
      });

      // Process water limit releases
      waterLimitReleases.forEach(release => {
        const category = this.taxCategories[release.type] || 'Other Income';
        if (!incomeByCategory[category]) {
          incomeByCategory[category] = 0;
        }
        incomeByCategory[category] += release.amount;
        totalIncome += release.amount;
      });

      // Calculate taxes
      const federalTax = this.calculateFederalTax(totalIncome, user.filingStatus || 'single');
      const stateTax = this.calculateStateTax(totalIncome, user.stateCode);

      // Calculate VAT if applicable
      const vatInfo = user.countryCode ? this.calculateVAT(totalIncome, user.countryCode) : null;

      return {
        userId,
        taxYear,
        userInfo: {
          name: user.name,
          email: user.email,
          address: user.address,
          stateCode: user.stateCode,
          countryCode: user.countryCode,
          filingStatus: user.filingStatus || 'single'
        },
        income: {
          total: totalIncome,
          byCategory: incomeByCategory,
          breakdown: {
            transactions: transactions.length,
            waterLimitReleases: waterLimitReleases.length
          }
        },
        taxes: {
          federal: {
            totalTax: federalTax.totalTax,
            effectiveRate: federalTax.effectiveRate,
            brackets: federalTax.brackets
          },
          state: {
            totalTax: stateTax.totalTax,
            rate: stateTax.rate,
            stateName: stateTax.stateName
          },
          vat: vatInfo ? {
            vatAmount: vatInfo.vatAmount,
            rate: vatInfo.rate,
            countryName: vatInfo.countryName,
            netAmount: vatInfo.netAmount
          } : null
        },
        taxForms: {
          required: this.getRequiredTaxForms(totalIncome, user.stateCode, user.countryCode),
          dueDate: this.getTaxDueDate(taxYear),
          filingDeadline: this.getFilingDeadline(taxYear)
        },
        documentation: {
          transactionHistory: transactions.map(t => ({
            id: t.id,
            date: t.createdAt,
            amount: t.amount,
            description: t.description,
            category: this.taxCategories[t.metadata?.waterLimitType] || 'Other Income'
          })),
          waterLimitReleases: waterLimitReleases.map(r => ({
            id: r.id,
            date: r.releasedAt,
            amount: r.amount,
            type: r.type,
            category: this.taxCategories[r.type] || 'Other Income'
          }))
        }
      };
    } catch (error) {
      console.error('Error generating consumer tax info:', error);
      throw new Error(`Failed to generate tax information: ${error.message}`);
    }
  }

  // Get business revenue and tax information for administration
  async getBusinessTaxInfo(startDate, endDate) {
    try {
      // Get all transactions in the date range
      const transactions = await this.DI.transactionRepository.find({
        createdAt: {
          $gte: startDate,
          $lte: endDate
        },
        status: 'completed'
      });

      // Get all water limit releases in the date range
      const waterLimitReleases = await this.DI.waterLimitRepository.find({
        releasedAt: {
          $gte: startDate,
          $lte: endDate
        },
        status: 'released'
      });

      // Calculate revenue by category
      const revenueByCategory = {};
      const revenueByUser = {};
      let totalRevenue = 0;

      // Process transactions (negative amounts are revenue for the business)
      transactions.forEach(transaction => {
        if (transaction.amount < 0) { // Negative amounts are business revenue
          const amount = Math.abs(transaction.amount);
          const category = transaction.metadata?.feeType || transaction.type;
          
          if (!revenueByCategory[category]) {
            revenueByCategory[category] = 0;
          }
          revenueByCategory[category] += amount;
          
          if (!revenueByUser[transaction.userId]) {
            revenueByUser[transaction.userId] = 0;
          }
          revenueByUser[transaction.userId] += amount;
          
          totalRevenue += amount;
        }
      });

      // Process water limit releases (these are costs to the business)
      const waterLimitCosts = waterLimitReleases.reduce((sum, release) => sum + release.amount, 0);

      // Calculate business taxes
      const businessFederalTax = this.calculateFederalTax(totalRevenue, 'single'); // Business typically files as single
      const businessStateTax = this.calculateStateTax(totalRevenue, 'CA'); // Assuming CA as default

      // Calculate VAT obligations
      const vatObligations = {};
      const usersByCountry = await this.DI.userRepository.find({
        id: { $in: Object.keys(revenueByUser) }
      });

      usersByCountry.forEach(user => {
        if (user.countryCode && this.vatRates[user.countryCode]) {
          const userRevenue = revenueByUser[user.id] || 0;
          const vatInfo = this.calculateVAT(userRevenue, user.countryCode);
          
          if (!vatObligations[user.countryCode]) {
            vatObligations[user.countryCode] = {
              countryName: vatInfo.countryName,
              rate: vatInfo.rate,
              totalRevenue: 0,
              totalVAT: 0,
              userCount: 0
            };
          }
          
          vatObligations[user.countryCode].totalRevenue += userRevenue;
          vatObligations[user.countryCode].totalVAT += vatInfo.vatAmount;
          vatObligations[user.countryCode].userCount++;
        }
      });

      return {
        period: {
          startDate,
          endDate
        },
        revenue: {
          total: totalRevenue,
          byCategory: revenueByCategory,
          byUser: revenueByUser,
          waterLimitCosts,
          netRevenue: totalRevenue - waterLimitCosts
        },
        taxes: {
          federal: {
            totalTax: businessFederalTax.totalTax,
            effectiveRate: businessFederalTax.effectiveRate,
            brackets: businessFederalTax.brackets
          },
          state: {
            totalTax: businessStateTax.totalTax,
            rate: businessStateTax.rate,
            stateName: businessStateTax.stateName
          },
          vat: {
            obligations: vatObligations,
            totalVATObligation: Object.values(vatObligations).reduce((sum, vat) => sum + vat.totalVAT, 0)
          }
        },
        compliance: {
          requiredForms: this.getBusinessRequiredForms(totalRevenue, startDate, endDate),
          filingDeadlines: this.getBusinessFilingDeadlines(startDate, endDate),
          recordKeeping: {
            transactionCount: transactions.length,
            waterLimitReleaseCount: waterLimitReleases.length,
            userCount: Object.keys(revenueByUser).length,
            countriesWithVAT: Object.keys(vatObligations).length
          }
        },
        analytics: {
          topRevenueCategories: Object.entries(revenueByCategory)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([category, amount]) => ({ category, amount })),
          topRevenueUsers: Object.entries(revenueByUser)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([userId, amount]) => ({ userId, amount })),
          revenueTrends: await this.calculateRevenueTrends(startDate, endDate)
        }
      };
    } catch (error) {
      console.error('Error generating business tax info:', error);
      throw new Error(`Failed to generate business tax information: ${error.message}`);
    }
  }

  // Calculate revenue trends over time
  async calculateRevenueTrends(startDate, endDate) {
    const monthlyRevenue = {};
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
      monthlyRevenue[monthKey] = 0;
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    // Get transactions for trend calculation
    const transactions = await this.DI.transactionRepository.find({
      createdAt: {
        $gte: startDate,
        $lte: endDate
      },
      amount: { $lt: 0 }, // Business revenue
      status: 'completed'
    });

    transactions.forEach(transaction => {
      const monthKey = `${transaction.createdAt.getFullYear()}-${String(transaction.createdAt.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyRevenue[monthKey] !== undefined) {
        monthlyRevenue[monthKey] += Math.abs(transaction.amount);
      }
    });

    return Object.entries(monthlyRevenue).map(([month, revenue]) => ({
      month,
      revenue,
      growth: 0 // Would calculate growth rate here
    }));
  }

  // Get required tax forms for consumers
  getRequiredTaxForms(income, stateCode, countryCode) {
    const forms = [];

    // US Federal forms
    if (countryCode === 'US' || !countryCode) {
      forms.push('Form 1040 - Individual Income Tax Return');
      
      if (income > 0) {
        forms.push('Schedule 1 - Additional Income and Adjustments to Income');
      }
      
      if (income > 400) {
        forms.push('Schedule SE - Self-Employment Tax');
      }
    }

    // State forms
    if (stateCode && this.stateTaxRates[stateCode]) {
      forms.push(`${this.stateTaxRates[stateCode].name} State Tax Return`);
    }

    // VAT forms for EU countries
    if (countryCode && this.vatRates[countryCode]) {
      forms.push(`${this.vatRates[countryCode].name} VAT Return`);
    }

    return forms;
  }

  // Get required business tax forms
  getBusinessRequiredForms(revenue, startDate, endDate) {
    const forms = [];
    const isQuarterly = this.isQuarterlyPeriod(startDate, endDate);
    const isAnnual = this.isAnnualPeriod(startDate, endDate);

    // US Federal forms
    forms.push('Form 1120S - S Corporation Tax Return');
    
    if (isQuarterly) {
      forms.push('Form 941 - Employer\'s Quarterly Federal Tax Return');
    }
    
    if (isAnnual) {
      forms.push('Form 940 - Employer\'s Annual Federal Unemployment Tax Return');
    }

    // State forms
    forms.push('California State Tax Return');
    
    if (isQuarterly) {
      forms.push('California State Quarterly Tax Return');
    }

    // International forms
    forms.push('Form 5471 - Information Return of U.S. Persons With Respect To Certain Foreign Corporations');
    forms.push('Form 5472 - Information Return of a 25% Foreign-Owned U.S. Corporation');

    return forms;
  }

  // Get tax due date
  getTaxDueDate(taxYear) {
    return new Date(taxYear + 1, 3, 15); // April 15th of next year
  }

  // Get filing deadline
  getFilingDeadline(taxYear) {
    return new Date(taxYear + 1, 3, 15); // April 15th of next year
  }

  // Get business filing deadlines
  getBusinessFilingDeadlines(startDate, endDate) {
    const deadlines = [];
    const isQuarterly = this.isQuarterlyPeriod(startDate, endDate);
    const isAnnual = this.isAnnualPeriod(startDate, endDate);

    if (isQuarterly) {
      deadlines.push({
        form: 'Form 941',
        dueDate: new Date(endDate.getFullYear(), endDate.getMonth() + 1, 15),
        description: 'Quarterly Employment Tax Return'
      });
    }

    if (isAnnual) {
      deadlines.push({
        form: 'Form 1120S',
        dueDate: new Date(endDate.getFullYear() + 1, 2, 15), // March 15th
        description: 'S Corporation Tax Return'
      });
    }

    return deadlines;
  }

  // Check if period is quarterly
  isQuarterlyPeriod(startDate, endDate) {
    const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                      (endDate.getMonth() - startDate.getMonth());
    return monthsDiff === 2; // 3 months = quarterly
  }

  // Check if period is annual
  isAnnualPeriod(startDate, endDate) {
    const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                      (endDate.getMonth() - startDate.getMonth());
    return monthsDiff === 11; // 12 months = annual
  }

  // Generate tax summary for multiple users
  async generateTaxSummary(userIds, taxYear) {
    const summaries = [];
    
    for (const userId of userIds) {
      try {
        const taxInfo = await this.getConsumerTaxInfo(userId, taxYear);
        summaries.push(taxInfo);
      } catch (error) {
        console.error(`Error generating tax summary for user ${userId}:`, error);
        summaries.push({
          userId,
          error: error.message,
          taxYear
        });
      }
    }

    return {
      taxYear,
      totalUsers: userIds.length,
      successfulSummaries: summaries.filter(s => !s.error).length,
      failedSummaries: summaries.filter(s => s.error).length,
      summaries
    };
  }
}

module.exports = { TaxService }; 