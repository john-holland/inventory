const { TaxService } = require("../services/taxService");

class TaxController {
  constructor(DI) {
    this.DI = DI;
    this.taxService = new TaxService(DI);
  }

  // Get consumer tax information for a specific user
  async getConsumerTaxInfo(req, res) {
    try {
      const userId = req.user.id;
      const { taxYear = new Date().getFullYear() } = req.query;

      if (!taxYear || isNaN(taxYear)) {
        return res.status(400).json({ 
          error: 'Invalid tax year. Please provide a valid year (e.g., 2024)' 
        });
      }

      const taxInfo = await this.taxService.getConsumerTaxInfo(userId, parseInt(taxYear));

      res.json({
        success: true,
        taxInfo,
        note: "This information is provided for tax reporting purposes. Please consult with a tax professional for official tax advice."
      });
    } catch (error) {
      console.error('Error getting consumer tax info:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get consumer tax information for a specific tax year with detailed breakdown
  async getConsumerTaxBreakdown(req, res) {
    try {
      const userId = req.user.id;
      const { taxYear = new Date().getFullYear(), includeTransactions = 'false' } = req.query;

      if (!taxYear || isNaN(taxYear)) {
        return res.status(400).json({ 
          error: 'Invalid tax year. Please provide a valid year (e.g., 2024)' 
        });
      }

      const taxInfo = await this.taxService.getConsumerTaxInfo(userId, parseInt(taxYear));

      // Remove detailed transaction history unless specifically requested
      if (includeTransactions !== 'true') {
        delete taxInfo.documentation.transactionHistory;
        delete taxInfo.documentation.waterLimitReleases;
      }

      res.json({
        success: true,
        taxInfo,
        note: "Tax breakdown provided for reporting purposes. Consult a tax professional for official advice."
      });
    } catch (error) {
      console.error('Error getting consumer tax breakdown:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get consumer tax summary for multiple years
  async getConsumerTaxSummary(req, res) {
    try {
      const userId = req.user.id;
      const { startYear = new Date().getFullYear() - 2, endYear = new Date().getFullYear() } = req.query;

      if (!startYear || !endYear || isNaN(startYear) || isNaN(endYear)) {
        return res.status(400).json({ 
          error: 'Invalid year range. Please provide valid start and end years.' 
        });
      }

      const summaries = [];
      for (let year = parseInt(startYear); year <= parseInt(endYear); year++) {
        try {
          const taxInfo = await this.taxService.getConsumerTaxInfo(userId, year);
          summaries.push({
            year,
            totalIncome: taxInfo.income.total,
            federalTax: taxInfo.taxes.federal.totalTax,
            stateTax: taxInfo.taxes.state.totalTax,
            vatAmount: taxInfo.taxes.vat?.vatAmount || 0,
            effectiveTaxRate: taxInfo.taxes.federal.effectiveRate
          });
        } catch (error) {
          summaries.push({
            year,
            error: error.message
          });
        }
      }

      res.json({
        success: true,
        summaries,
        note: "Multi-year tax summary for planning purposes. Consult a tax professional for official advice."
      });
    } catch (error) {
      console.error('Error getting consumer tax summary:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get business revenue and tax information (Admin only)
  async getBusinessTaxInfo(req, res) {
    try {
      // Check if user is admin
      if (!req.user.isAdmin) {
        return res.status(403).json({ 
          error: 'Access denied. Admin privileges required for business tax information.' 
        });
      }

      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ 
          error: 'Start date and end date are required (YYYY-MM-DD format)' 
        });
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ 
          error: 'Invalid date format. Please use YYYY-MM-DD format.' 
        });
      }

      if (start >= end) {
        return res.status(400).json({ 
          error: 'Start date must be before end date.' 
        });
      }

      const businessTaxInfo = await this.taxService.getBusinessTaxInfo(start, end);

      res.json({
        success: true,
        businessTaxInfo,
        note: "Business tax information for administrative and compliance purposes."
      });
    } catch (error) {
      console.error('Error getting business tax info:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get business revenue analytics (Admin only)
  async getBusinessRevenueAnalytics(req, res) {
    try {
      // Check if user is admin
      if (!req.user.isAdmin) {
        return res.status(403).json({ 
          error: 'Access denied. Admin privileges required for business analytics.' 
        });
      }

      const { period = 'current_year' } = req.query;
      
      let startDate, endDate;
      const now = new Date();

      switch (period) {
        case 'current_year':
          startDate = new Date(now.getFullYear(), 0, 1);
          endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
          break;
        case 'previous_year':
          startDate = new Date(now.getFullYear() - 1, 0, 1);
          endDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59);
          break;
        case 'current_quarter':
          const currentQuarter = Math.floor(now.getMonth() / 3);
          startDate = new Date(now.getFullYear(), currentQuarter * 3, 1);
          endDate = new Date(now.getFullYear(), (currentQuarter + 1) * 3, 0, 23, 59, 59);
          break;
        case 'current_month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
          break;
        default:
          return res.status(400).json({ 
            error: 'Invalid period. Use: current_year, previous_year, current_quarter, or current_month' 
          });
      }

      const businessTaxInfo = await this.taxService.getBusinessTaxInfo(startDate, endDate);

      res.json({
        success: true,
        period,
        startDate,
        endDate,
        analytics: businessTaxInfo.analytics,
        revenue: {
          total: businessTaxInfo.revenue.total,
          net: businessTaxInfo.revenue.netRevenue,
          byCategory: businessTaxInfo.revenue.byCategory
        },
        taxes: {
          federal: businessTaxInfo.taxes.federal,
          state: businessTaxInfo.taxes.state,
          vat: businessTaxInfo.taxes.vat
        },
        note: "Business revenue analytics for strategic planning and compliance."
      });
    } catch (error) {
      console.error('Error getting business revenue analytics:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Get tax compliance report (Admin only)
  async getTaxComplianceReport(req, res) {
    try {
      // Check if user is admin
      if (!req.user.isAdmin) {
        return res.status(403).json({ 
          error: 'Access denied. Admin privileges required for compliance reports.' 
        });
      }

      const { startDate, endDate, includeUserDetails = 'false' } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({ 
          error: 'Start date and end date are required (YYYY-MM-DD format)' 
        });
      }

      const start = new Date(startDate);
      const end = new Date(endDate);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ 
          error: 'Invalid date format. Please use YYYY-MM-DD format.' 
        });
      }

      const businessTaxInfo = await this.taxService.getBusinessTaxInfo(start, end);

      // Get user tax summaries if requested
      let userTaxSummaries = null;
      if (includeUserDetails === 'true') {
        const userIds = Object.keys(businessTaxInfo.revenue.byUser);
        userTaxSummaries = await this.taxService.generateTaxSummary(userIds, start.getFullYear());
      }

      const complianceReport = {
        period: {
          startDate: start,
          endDate: end
        },
        businessCompliance: {
          requiredForms: businessTaxInfo.compliance.requiredForms,
          filingDeadlines: businessTaxInfo.compliance.filingDeadlines,
          recordKeeping: businessTaxInfo.compliance.recordKeeping
        },
        taxObligations: {
          federal: {
            totalTax: businessTaxInfo.taxes.federal.totalTax,
            effectiveRate: businessTaxInfo.taxes.federal.effectiveRate,
            filingDeadline: businessTaxInfo.compliance.filingDeadlines.find(d => d.form === 'Form 1120S')?.dueDate
          },
          state: {
            totalTax: businessTaxInfo.taxes.state.totalTax,
            rate: businessTaxInfo.taxes.state.rate,
            stateName: businessTaxInfo.taxes.state.stateName
          },
          vat: {
            totalObligation: businessTaxInfo.taxes.vat.totalVATObligation,
            obligationsByCountry: businessTaxInfo.taxes.vat.obligations
          }
        },
        revenueSummary: {
          totalRevenue: businessTaxInfo.revenue.total,
          netRevenue: businessTaxInfo.revenue.netRevenue,
          waterLimitCosts: businessTaxInfo.revenue.waterLimitCosts,
          topCategories: businessTaxInfo.analytics.topRevenueCategories,
          topUsers: businessTaxInfo.analytics.topRevenueUsers
        },
        userTaxSummaries: userTaxSummaries,
        recommendations: this.generateComplianceRecommendations(businessTaxInfo)
      };

      res.json({
        success: true,
        complianceReport,
        note: "Tax compliance report for regulatory and administrative purposes."
      });
    } catch (error) {
      console.error('Error getting tax compliance report:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Generate compliance recommendations
  generateComplianceRecommendations(businessTaxInfo) {
    const recommendations = [];

    // Check for high revenue categories
    const highRevenueCategories = businessTaxInfo.analytics.topRevenueCategories
      .filter(cat => cat.amount > 10000);
    
    if (highRevenueCategories.length > 0) {
      recommendations.push({
        type: 'revenue_tracking',
        priority: 'high',
        message: `High revenue categories detected: ${highRevenueCategories.map(c => c.category).join(', ')}. Ensure proper categorization for tax purposes.`
      });
    }

    // Check VAT obligations
    if (businessTaxInfo.taxes.vat.totalVATObligation > 0) {
      recommendations.push({
        type: 'vat_compliance',
        priority: 'high',
        message: `VAT obligations detected across ${Object.keys(businessTaxInfo.taxes.vat.obligations).length} countries. Ensure timely VAT filings.`
      });
    }

    // Check filing deadlines
    const upcomingDeadlines = businessTaxInfo.compliance.filingDeadlines
      .filter(deadline => deadline.dueDate > new Date())
      .sort((a, b) => a.dueDate - b.dueDate);

    if (upcomingDeadlines.length > 0) {
      recommendations.push({
        type: 'filing_deadlines',
        priority: 'medium',
        message: `Upcoming filing deadlines: ${upcomingDeadlines.map(d => `${d.form} due ${d.dueDate.toLocaleDateString()}`).join(', ')}`
      });
    }

    // Check record keeping
    if (businessTaxInfo.compliance.recordKeeping.transactionCount > 10000) {
      recommendations.push({
        type: 'record_keeping',
        priority: 'medium',
        message: 'High transaction volume detected. Consider implementing automated record keeping systems.'
      });
    }

    return recommendations;
  }

  // Get tax rates and information
  async getTaxRates(req, res) {
    try {
      const { countryCode, stateCode } = req.query;

      const taxRates = {
        federal: {
          description: 'US Federal Income Tax Rates (2024)',
          rates: this.taxService.federalTaxRates
        }
      };

      if (stateCode) {
        const stateInfo = this.taxService.stateTaxRates[stateCode];
        if (stateInfo) {
          taxRates.state = {
            code: stateCode,
            name: stateInfo.name,
            rate: stateInfo.rate
          };
        }
      }

      if (countryCode) {
        const vatInfo = this.taxService.vatRates[countryCode];
        if (vatInfo) {
          taxRates.vat = {
            code: countryCode,
            name: vatInfo.name,
            rate: vatInfo.rate
          };
        }
      }

      res.json({
        success: true,
        taxRates,
        note: "Tax rates are for informational purposes. Actual rates may vary based on specific circumstances."
      });
    } catch (error) {
      console.error('Error getting tax rates:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Export tax data for external systems
  async exportTaxData(req, res) {
    try {
      const userId = req.user.id;
      const { taxYear = new Date().getFullYear(), format = 'json' } = req.query;

      if (!taxYear || isNaN(taxYear)) {
        return res.status(400).json({ 
          error: 'Invalid tax year. Please provide a valid year (e.g., 2024)' 
        });
      }

      const taxInfo = await this.taxService.getConsumerTaxInfo(userId, parseInt(taxYear));

      if (format === 'csv') {
        // Generate CSV format
        const csvData = this.generateTaxCSV(taxInfo);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="tax_data_${userId}_${taxYear}.csv"`);
        res.send(csvData);
      } else {
        // JSON format
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="tax_data_${userId}_${taxYear}.json"`);
        res.json(taxInfo);
      }
    } catch (error) {
      console.error('Error exporting tax data:', error);
      res.status(500).json({ error: error.message });
    }
  }

  // Generate CSV format for tax data
  generateTaxCSV(taxInfo) {
    const lines = [];
    
    // Header
    lines.push('Tax Year,Category,Amount,Description');
    
    // Income by category
    Object.entries(taxInfo.income.byCategory).forEach(([category, amount]) => {
      lines.push(`${taxInfo.taxYear},${category},${amount},Income`);
    });
    
    // Taxes
    lines.push(`${taxInfo.taxYear},Federal Tax,${taxInfo.taxes.federal.totalTax},Tax`);
    lines.push(`${taxInfo.taxYear},State Tax,${taxInfo.taxes.state.totalTax},Tax`);
    
    if (taxInfo.taxes.vat) {
      lines.push(`${taxInfo.taxYear},VAT,${taxInfo.taxes.vat.vatAmount},Tax`);
    }
    
    return lines.join('\n');
  }
}

module.exports = { TaxController }; 