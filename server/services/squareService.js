const axios = require('axios');
const { wrap } = require("@mikro-orm/core");
const { getCoefficient } = require('../config/ConstantMarketCoefficients');

class SquareService {
  constructor(DI) {
    this.DI = DI;
    this.constants = getCoefficient;
    this.config = {
      accessToken: process.env.SQUARE_ACCESS_TOKEN,
      environment: process.env.SQUARE_ENVIRONMENT || 'sandbox',
      apiVersion: this.constants('AMAZON.API.VERSION', '2024-02-15')
    };
    
    this.baseUrl = this.config.environment === 'production' 
      ? 'https://connect.squareup.com' 
      : 'https://connect.squareupsandbox.com';
  }

  // Get Square API headers
  getHeaders() {
    return {
      'Authorization': `Bearer ${this.config.accessToken}`,
      'Square-Version': this.apiVersion,
      'Content-Type': 'application/json'
    };
  }

  // Get Square locations
  async getLocations() {
    try {
      const response = await axios.get(`${this.baseUrl}/v2/locations`, {
        headers: this.getHeaders()
      });

      return response.data.locations || [];
    } catch (error) {
      console.error('Error getting Square locations:', error);
      throw new Error('Failed to get Square locations');
    }
  }

  // Get Square payments (bills/expenses)
  async getPayments(locationId, startDate = null, endDate = null) {
    try {
      const params = {
        location_id: locationId,
        limit: 100
      };

      if (startDate) {
        params.begin_time = startDate.toISOString();
      }
      if (endDate) {
        params.end_time = endDate.toISOString();
      }

      const response = await axios.get(`${this.baseUrl}/v2/payments`, {
        headers: this.getHeaders(),
        params
      });

      return response.data.payments || [];
    } catch (error) {
      console.error('Error getting Square payments:', error);
      throw new Error('Failed to get Square payments');
    }
  }

  // Get Square refunds (for bill tracking)
  async getRefunds(locationId, startDate = null, endDate = null) {
    try {
      const params = {
        location_id: locationId,
        limit: 100
      };

      if (startDate) {
        params.begin_time = startDate.toISOString();
      }
      if (endDate) {
        params.end_time = endDate.toISOString();
      }

      const response = await axios.get(`${this.baseUrl}/v2/refunds`, {
        headers: this.getHeaders(),
        params
      });

      return response.data.refunds || [];
    } catch (error) {
      console.error('Error getting Square refunds:', error);
      throw new Error('Failed to get Square refunds');
    }
  }

  // Get Square orders (for bill categorization)
  async getOrders(locationId, startDate = null, endDate = null) {
    try {
      const params = {
        location_ids: [locationId],
        limit: 100
      };

      if (startDate) {
        params.created_at = {
          start_at: startDate.toISOString(),
          end_at: endDate ? endDate.toISOString() : new Date().toISOString()
        };
      }

      const response = await axios.post(`${this.baseUrl}/v2/orders/search`, params, {
        headers: this.getHeaders()
      });

      return response.data.orders || [];
    } catch (error) {
      console.error('Error getting Square orders:', error);
      throw new Error('Failed to get Square orders');
    }
  }

  // Categorize bill based on description and vendor
  categorizeBill(description, vendor, amount) {
    const desc = description.toLowerCase();
    const vend = vendor.toLowerCase();

    // Server/Infrastructure bills
    const serverKeywords = ['server', 'hosting', 'cloud', 'aws', 'azure', 'gcp', 'digitalocean', 'heroku', 'vps', 'dedicated', 'infrastructure', 'ssl', 'domain', 'dns'];
    if (serverKeywords.some(keyword => desc.includes(keyword) || vend.includes(keyword))) {
      return 'server';
    }

    // IT/Software bills
    const itKeywords = ['software', 'hardware', 'maintenance', 'support', 'license', 'subscription', 'microsoft', 'adobe', 'slack', 'zoom', 'github', 'jira', 'confluence', 'antivirus', 'backup'];
    if (itKeywords.some(keyword => desc.includes(keyword) || vend.includes(keyword))) {
      return 'it';
    }

    // HR/People bills
    const hrKeywords = ['payroll', 'benefits', 'training', 'recruitment', 'hr', 'human resources', 'insurance', 'health', 'dental', 'vision', '401k', 'pension', 'bonus', 'commission'];
    if (hrKeywords.some(keyword => desc.includes(keyword) || vend.includes(keyword))) {
      return 'hr';
    }

    // Default to other if no category matches
    return 'other';
  }

  // Sync bills from Square
  async syncBills(squareAccountId, startDate = null, endDate = null) {
    try {
      const squareAccount = await this.DI.squareAccountRepository.findOneOrFail({ id: squareAccountId });
      
      if (!startDate) {
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      }
      if (!endDate) {
        endDate = new Date();
      }

      // Get payments from Square
      const payments = await this.getPayments(squareAccount.squareLocationId, startDate, endDate);
      const refunds = await this.getRefunds(squareAccount.squareLocationId, startDate, endDate);
      const orders = await this.getOrders(squareAccount.squareLocationId, startDate, endDate);

      const bills = [];
      const billCategories = {
        server: { count: 0, amount: 0 },
        it: { count: 0, amount: 0 },
        hr: { count: 0, amount: 0 },
        other: { count: 0, amount: 0 }
      };

      // Process payments as bills
      for (const payment of payments) {
        if (payment.status === 'COMPLETED' && payment.total_money) {
          const amount = payment.total_money.amount / 100; // Convert from cents
          const description = payment.note || payment.receipt_number || 'Square Payment';
          const vendor = payment.source_type || 'Square';
          const category = this.categorizeBill(description, vendor, amount);

          const bill = new this.DI.squareBillRepository.entity(
            squareAccountId,
            payment.id,
            amount,
            payment.total_money.currency || 'USD',
            category,
            description,
            new Date(payment.created_at),
            'paid'
          );

          bill.paidDate = new Date(payment.updated_at);
          bill.paymentMethod = payment.source_type || 'card';
          bill.vendor = vendor;
          bill.invoiceNumber = payment.receipt_number || '';
          bill.metadata = {
            ...bill.metadata,
            squareLocationId: squareAccount.squareLocationId,
            squareMerchantId: payment.merchant_id,
            receiptUrl: payment.receipt_url,
            autoCategorized: true
          };

          await this.DI.squareBillRepository.persistAndFlush(bill);
          bills.push(bill);

          // Update category statistics
          billCategories[category].count++;
          billCategories[category].amount += amount;
        }
      }

      // Update Square account metadata
      wrap(squareAccount).assign({
        lastSync: new Date(),
        metadata: {
          ...squareAccount.metadata,
          lastBillSync: new Date(),
          totalBills: bills.length,
          totalAmount: bills.reduce((sum, bill) => sum + bill.amount, 0),
          billCategories
        }
      });

      await this.DI.squareAccountRepository.flush();

      return {
        success: true,
        billsProcessed: bills.length,
        totalAmount: bills.reduce((sum, bill) => sum + bill.amount, 0),
        billCategories,
        bills
      };
    } catch (error) {
      console.error('Error syncing Square bills:', error);
      throw new Error('Failed to sync Square bills');
    }
  }

  // Calculate water level adjustments based on bills
  async calculateWaterLevelAdjustments(squareAccountId, month = null) {
    try {
      const squareAccount = await this.DI.squareAccountRepository.findOneOrFail({ id: squareAccountId });
      
      if (!month) {
        month = new Date();
      }

      const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
      const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);

      // Get bills for the month
      const bills = await this.DI.squareBillRepository.find({
        squareAccountId: squareAccountId,
        billDate: {
          $gte: startDate,
          $lte: endDate
        },
        status: 'paid'
      });

      const adjustments = [];
      const waterLimits = await this.DI.waterLimitRepository.find({ status: 'active' });

      // Calculate monthly averages for each category
      const monthlyAverages = {};
      const categories = ['server', 'it', 'hr'];

      for (const category of categories) {
        const categoryBills = bills.filter(bill => bill.category === category);
        const totalAmount = categoryBills.reduce((sum, bill) => sum + bill.amount, 0);
        monthlyAverages[category] = totalAmount;
      }

      // Create water level adjustments
      for (const waterLimit of waterLimits) {
        for (const category of categories) {
          const categoryAmount = monthlyAverages[category] || 0;
          
          if (categoryAmount > 0) {
            // Get impact coefficient from constants
            const impactCoefficient = this.constants(`WATER_LEVEL.BILL_CATEGORY_IMPACT.${category.toUpperCase()}`, 0.1);
            
            // Calculate adjustment based on bill category and amount
            let adjustmentAmount = categoryAmount * impactCoefficient;
            let adjustmentType = this.constants('WATER_LEVEL.ADJUSTMENT_TYPES.THRESHOLD_ADJUSTMENT', 'threshold_adjustment');

            // Server bills increase threshold (need more buffer for infrastructure)
            if (category === 'server') {
              adjustmentType = this.constants('WATER_LEVEL.ADJUSTMENT_TYPES.INCREASE', 'increase');
            }
            // IT bills moderate threshold adjustment
            else if (category === 'it') {
              adjustmentType = this.constants('WATER_LEVEL.ADJUSTMENT_TYPES.INCREASE', 'increase');
            }
            // HR bills decrease threshold (operational costs)
            else if (category === 'hr') {
              adjustmentType = this.constants('WATER_LEVEL.ADJUSTMENT_TYPES.DECREASE', 'decrease');
            }

            if (adjustmentAmount > 0) {
              const waterLevelBill = new this.DI.waterLevelBillRepository.entity(
                waterLimit.id,
                null, // Will be set when processing
                category,
                adjustmentAmount,
                adjustmentType,
                `Monthly ${category} bills adjustment: $${categoryAmount.toFixed(2)}`
              );

              waterLevelBill.metadata = {
                ...waterLevelBill.metadata,
                originalThreshold: waterLimit.threshold,
                newThreshold: waterLimit.threshold + (adjustmentType === 'increase' ? adjustmentAmount : -adjustmentAmount),
                monthlyAverage: categoryAmount,
                adjustmentReason: `Monthly ${category} expenses: $${categoryAmount.toFixed(2)}`,
                impactCoefficient: impactCoefficient
              };

              await this.DI.waterLevelBillRepository.persistAndFlush(waterLevelBill);
              adjustments.push(waterLevelBill);
            }
          }
        }
      }

      return {
        success: true,
        adjustmentsCreated: adjustments.length,
        monthlyAverages,
        adjustments
      };
    } catch (error) {
      console.error('Error calculating water level adjustments:', error);
      throw new Error('Failed to calculate water level adjustments');
    }
  }

  // Process water level adjustments
  async processWaterLevelAdjustments() {
    try {
      const pendingAdjustments = await this.DI.waterLevelBillRepository.find({
        processed: false,
        effectiveDate: { $lte: new Date() }
      });

      const processed = [];
      const errors = [];

      for (const adjustment of pendingAdjustments) {
        try {
          const waterLimit = await this.DI.waterLimitRepository.findOne({ id: adjustment.waterLimitId });
          
          if (!waterLimit) {
            errors.push(`Water limit not found for adjustment ${adjustment.id}`);
            continue;
          }

          // Apply adjustment to water limit
          const originalThreshold = waterLimit.threshold;
          let newThreshold = originalThreshold;

          if (adjustment.adjustmentType === 'increase') {
            newThreshold += adjustment.amount;
          } else if (adjustment.adjustmentType === 'decrease') {
            newThreshold = Math.max(0, newThreshold - adjustment.amount);
          } else if (adjustment.adjustmentType === 'threshold_adjustment') {
            newThreshold = adjustment.amount;
          }

          wrap(waterLimit).assign({
            threshold: newThreshold,
            lastUpdated: new Date()
          });

          // Mark adjustment as processed
          wrap(adjustment).assign({
            processed: true,
            processedDate: new Date(),
            metadata: {
              ...adjustment.metadata,
              originalThreshold,
              newThreshold
            }
          });

          processed.push(adjustment);
        } catch (error) {
          console.error(`Error processing adjustment ${adjustment.id}:`, error);
          errors.push(`Failed to process adjustment ${adjustment.id}: ${error.message}`);
        }
      }

      await this.DI.waterLevelBillRepository.flush();
      await this.DI.waterLimitRepository.flush();

      return {
        success: true,
        processed: processed.length,
        errors: errors.length,
        processedAdjustments: processed,
        errorMessages: errors
      };
    } catch (error) {
      console.error('Error processing water level adjustments:', error);
      throw new Error('Failed to process water level adjustments');
    }
  }

  // Get Square account analytics
  async getSquareAnalytics(squareAccountId) {
    try {
      const squareAccount = await this.DI.squareAccountRepository.findOneOrFail({ id: squareAccountId });
      
      const bills = await this.DI.squareBillRepository.find({
        squareAccountId: squareAccountId
      }, {
        orderBy: { billDate: 'DESC' }
      });

      const totalBills = bills.length;
      const totalAmount = bills.reduce((sum, bill) => sum + bill.amount, 0);

      // Calculate monthly trends
      const monthlyTrends = {};
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();

      for (let i = 0; i < 6; i++) {
        const month = (currentMonth - i + 12) % 12;
        const year = currentMonth - i < 0 ? currentYear - 1 : currentYear;
        const monthKey = `${year}-${month + 1}`;

        const monthBills = bills.filter(bill => {
          const billDate = new Date(bill.billDate);
          return billDate.getMonth() === month && billDate.getFullYear() === year;
        });

        monthlyTrends[monthKey] = {
          count: monthBills.length,
          amount: monthBills.reduce((sum, bill) => sum + bill.amount, 0),
          categories: {
            server: monthBills.filter(bill => bill.category === 'server').reduce((sum, bill) => sum + bill.amount, 0),
            it: monthBills.filter(bill => bill.category === 'it').reduce((sum, bill) => sum + bill.amount, 0),
            hr: monthBills.filter(bill => bill.category === 'hr').reduce((sum, bill) => sum + bill.amount, 0),
            other: monthBills.filter(bill => bill.category === 'other').reduce((sum, bill) => sum + bill.amount, 0)
          }
        };
      }

      // Get water level impact
      const waterLevelBills = await this.DI.waterLevelBillRepository.find({
        squareAccountId: squareAccountId
      });

      const totalWaterLevelImpact = waterLevelBills.reduce((sum, bill) => sum + bill.amount, 0);

      return {
        success: true,
        analytics: {
          totalBills,
          totalAmount,
          monthlyTrends,
          billCategories: squareAccount.metadata.billCategories,
          totalWaterLevelImpact,
          lastSync: squareAccount.lastSync,
          accountStatus: squareAccount.status
        }
      };
    } catch (error) {
      console.error('Error getting Square analytics:', error);
      throw new Error('Failed to get Square analytics');
    }
  }

  // Refresh Square access token
  async refreshAccessToken(squareAccountId) {
    try {
      const squareAccount = await this.DI.squareAccountRepository.findOneOrFail({ id: squareAccountId });
      
      const response = await axios.post(`${this.baseUrl}/oauth2/token`, {
        client_id: process.env.SQUARE_CLIENT_ID,
        client_secret: process.env.SQUARE_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: squareAccount.refreshToken
      });

      const { access_token, refresh_token } = response.data;

      wrap(squareAccount).assign({
        squareAccessToken: access_token,
        refreshToken: refresh_token,
        lastSync: new Date()
      });

      await this.DI.squareAccountRepository.flush();

      return {
        success: true,
        message: 'Access token refreshed successfully'
      };
    } catch (error) {
      console.error('Error refreshing Square access token:', error);
      throw new Error('Failed to refresh access token');
    }
  }
}

module.exports = { SquareService }; 