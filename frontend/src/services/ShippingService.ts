// Shipping Service - Calculates shipping costs for items
// Integrates with various shipping providers and handles shipping hold calculations
// Triggers insurance hold investment after shipping phase
// Integrates with ShipStation for label optimization

import { InvestmentService } from './InvestmentService';
import { ShipStationService } from './ShipStationService';

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface ItemDimensions {
  length: number; // inches
  width: number;  // inches
  height: number; // inches
  weight: number; // lbs
}

export interface ShippingQuote {
  provider: 'USPS' | 'UPS' | 'FedEx' | 'DHL';
  serviceName: string;
  baseCost: number;
  insuranceCost: number;
  handlingFee: number;
  totalCost: number;
  estimatedDays: string;
  trackingIncluded: boolean;
  signatureRequired: boolean;
}

export interface ShippingHoldCalculation {
  shippingCost: number;
  insuranceCost: number;
  holdMultiplier: number; // Typically 2x for standard, 3x for premium
  totalHold: number;
  expectedReturn: number; // If all goes well
  provider: string;
  estimatedDeliveryDays: string;
}

export interface ShippingStatus {
  itemId: string;
  status: 'pending' | 'shipped' | 'delivered' | 'returned';
  trackingNumber?: string;
  estimatedDelivery?: string;
  cost: number;
  optimizationOpportunities: {
    available: boolean;
    potentialSavings: number;
    recommendedCarrier?: string;
  };
  investmentStatus: {
    insuranceHoldInvestable: boolean;
    totalInvestableHolds: number;
  };
}

export interface ShippingPreferences {
  userId: string;
  autoOptimizationEnabled: boolean;
  carrierPreferences: string[];
  insurancePreferences: {
    autoInsure: boolean;
    minValueThreshold: number;
  };
}

export class ShippingService {
  private static instance: ShippingService;
  private investmentService: InvestmentService;
  private shipStationService: ShipStationService;

  static getInstance(): ShippingService {
    if (!ShippingService.instance) {
      ShippingService.instance = new ShippingService();
    }
    return ShippingService.instance;
  }

  constructor() {
    this.investmentService = InvestmentService.getInstance();
    this.shipStationService = ShipStationService.getInstance();
    console.log('📦 Shipping Service initialized');
  }

  // Calculate distance between two zip codes (simplified)
  public calculateDistance(origin: ShippingAddress, destination: ShippingAddress): number {
    // In production, this would use a real geocoding API
    // For now, we'll use a simplified estimation
    const stateDistances: Record<string, Record<string, number>> = {
      'CA': { 'CA': 200, 'NY': 2800, 'TX': 1500, 'FL': 2700 },
      'NY': { 'CA': 2800, 'NY': 100, 'TX': 1600, 'FL': 1200 },
      'TX': { 'CA': 1500, 'NY': 1600, 'TX': 200, 'FL': 1100 },
      'FL': { 'CA': 2700, 'NY': 1200, 'TX': 1100, 'FL': 150 }
    };

    return stateDistances[origin.state]?.[destination.state] || 1000;
  }

  // Calculate dimensional weight (used by carriers for large but light packages)
  private calculateDimensionalWeight(dimensions: ItemDimensions): number {
    // Dimensional weight formula: (L x W x H) / 139 for domestic
    return (dimensions.length * dimensions.width * dimensions.height) / 139;
  }

  // Get billable weight (greater of actual or dimensional weight)
  private getBillableWeight(dimensions: ItemDimensions): number {
    const dimWeight = this.calculateDimensionalWeight(dimensions);
    return Math.max(dimensions.weight, dimWeight);
  }

  // Calculate base shipping rate
  private calculateBaseRate(
    distance: number,
    weight: number,
    provider: ShippingQuote['provider']
  ): number {
    const providerRates = {
      'USPS': { base: 5, perMile: 0.002, perLb: 0.5 },
      'UPS': { base: 8, perMile: 0.003, perLb: 0.6 },
      'FedEx': { base: 9, perMile: 0.0035, perLb: 0.7 },
      'DHL': { base: 12, perMile: 0.004, perLb: 0.8 }
    };

    const rates = providerRates[provider];
    return rates.base + (distance * rates.perMile) + (weight * rates.perLb);
  }

  // Get shipping quote from a specific provider
  getShippingQuote(
    origin: ShippingAddress,
    destination: ShippingAddress,
    dimensions: ItemDimensions,
    provider: ShippingQuote['provider'],
    itemValue: number = 100
  ): ShippingQuote {
    const distance = this.calculateDistance(origin, destination);
    const billableWeight = this.getBillableWeight(dimensions);
    const baseCost = this.calculateBaseRate(distance, billableWeight, provider);

    // Insurance cost (1% of item value, min $2)
    const insuranceCost = Math.max(2, itemValue * 0.01);

    // Handling fee (varies by provider)
    const handlingFee = provider === 'USPS' ? 1.5 : 3.0;

    // Total cost
    const totalCost = baseCost + insuranceCost + handlingFee;

    // Estimated delivery
    const daysMap = {
      'USPS': distance < 500 ? '2-3' : distance < 1500 ? '3-5' : '5-7',
      'UPS': distance < 500 ? '1-2' : distance < 1500 ? '2-4' : '4-6',
      'FedEx': distance < 500 ? '1-2' : distance < 1500 ? '2-3' : '3-5',
      'DHL': distance < 500 ? '1' : distance < 1500 ? '2-3' : '3-4'
    };

    return {
      provider,
      serviceName: `${provider} Ground`,
      baseCost: Math.round(baseCost * 100) / 100,
      insuranceCost: Math.round(insuranceCost * 100) / 100,
      handlingFee: Math.round(handlingFee * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      estimatedDays: daysMap[provider],
      trackingIncluded: true,
      signatureRequired: itemValue > 500
    };
  }

  // Get all available shipping quotes
  getAllShippingQuotes(
    origin: ShippingAddress,
    destination: ShippingAddress,
    dimensions: ItemDimensions,
    itemValue: number = 100
  ): ShippingQuote[] {
    const providers: ShippingQuote['provider'][] = ['USPS', 'UPS', 'FedEx', 'DHL'];
    return providers.map(provider => 
      this.getShippingQuote(origin, destination, dimensions, provider, itemValue)
    );
  }

  // Get cheapest shipping option
  getCheapestShippingQuote(
    origin: ShippingAddress,
    destination: ShippingAddress,
    dimensions: ItemDimensions,
    itemValue: number = 100
  ): ShippingQuote {
    const quotes = this.getAllShippingQuotes(origin, destination, dimensions, itemValue);
    return quotes.reduce((cheapest, current) => 
      current.totalCost < cheapest.totalCost ? current : cheapest
    );
  }

  // Calculate shipping hold amount (what borrower puts up as collateral)
  calculateShippingHold(
    origin: ShippingAddress,
    destination: ShippingAddress,
    dimensions: ItemDimensions,
    itemValue: number = 100,
    holdMultiplier: number = 2, // Standard 2x, premium 3x
    returnRate: number = 0.05 // 5% APY on held funds
  ): ShippingHoldCalculation {
    const quote = this.getCheapestShippingQuote(origin, destination, dimensions, itemValue);
    
    const totalHold = quote.totalCost * holdMultiplier;
    
    // Calculate expected return based on average hold duration (assume 30 days)
    const holdDurationDays = 30;
    const expectedReturn = totalHold * (returnRate / 365) * holdDurationDays;

    return {
      shippingCost: quote.totalCost,
      insuranceCost: quote.insuranceCost,
      holdMultiplier,
      totalHold: Math.round(totalHold * 100) / 100,
      expectedReturn: Math.round(expectedReturn * 100) / 100,
      provider: quote.provider,
      estimatedDeliveryDays: quote.estimatedDays
    };
  }

  // Calculate average shipping cost for an item (used for portfolio pricing)
  calculateAverageShippingCost(
    dimensions: ItemDimensions,
    itemValue: number = 100
  ): number {
    // Use standard origin/destination for averaging
    const standardOrigin: ShippingAddress = {
      street: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94102',
      country: 'USA'
    };

    const destinations: ShippingAddress[] = [
      { street: '', city: 'Los Angeles', state: 'CA', zipCode: '90001', country: 'USA' },
      { street: '', city: 'New York', state: 'NY', zipCode: '10001', country: 'USA' },
      { street: '', city: 'Houston', state: 'TX', zipCode: '77001', country: 'USA' },
      { street: '', city: 'Miami', state: 'FL', zipCode: '33101', country: 'USA' }
    ];

    const quotes = destinations.map(dest => 
      this.getCheapestShippingQuote(standardOrigin, dest, dimensions, itemValue)
    );

    const avgCost = quotes.reduce((sum, q) => sum + q.totalCost, 0) / quotes.length;
    return Math.round(avgCost * 100) / 100;
  }

  // Note: checkLabelOptimizationForQuote removed - use checkLabelOptimization instead

  // Update shipping preferences for optimization (simple version)
  updateOptimizationPreferences(settings: {
    autoOptimize: boolean;
    minimumSavings: number;
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  }): void {
    this.shipStationService.updateOptimizationSettings('user_default', {
      autoReinvestEnabled: settings.autoOptimize,
      minSavingsThreshold: settings.minimumSavings
    });

    console.log('⚙️ Shipping preferences updated:', settings);
  }

  // New methods for Plan #3 implementation

  /**
   * Process item shipping and trigger insurance hold investment
   */
  async processItemShipping(itemId: string, trackingNumber: string): Promise<{
    success: boolean;
    message: string;
    insuranceHoldTriggered: boolean;
  }> {
    console.log(`🚚 Processing item shipping for: ${itemId}`);

    try {
      // Update shipping status
      const shippingStatus = await this.updateShippingStatus(itemId, 'shipped', trackingNumber);

      // Insurance holds are now investable (handled by InvestmentService when queried)

      // Check for label optimization opportunities
      const optimizationCheck = await this.checkLabelOptimization(itemId);

      // Send shipping notifications
      await this.sendShippingNotifications(itemId, trackingNumber);

      console.log(`✅ Item ${itemId} shipped successfully`);

      return {
        success: true,
        message: `Item shipped with tracking: ${trackingNumber}`,
        insuranceHoldTriggered: true
      };

    } catch (error) {
      console.error(`❌ Failed to process shipping for item ${itemId}:`, error);
      return {
        success: false,
        message: `Failed to process shipping: ${error}`,
        insuranceHoldTriggered: false
      };
    }
  }

  /**
   * Check label optimization opportunities (main method)
   */
  async checkLabelOptimization(itemIdOrShipmentId: string): Promise<{
    optimizationAvailable: boolean;
    potentialSavings: number;
    recommendedAction: string;
  }> {
    console.log(`🔍 Checking label optimization for: ${itemIdOrShipmentId}`);

    try {
      // Try to get shipment
      const shipment = this.shipStationService.getShipment(itemIdOrShipmentId);
      
      if (shipment) {
        // We have a shipment, compare rates
        const comparisons = await this.shipStationService.compareRates(shipment);
        const bestOption = comparisons
          .filter(comp => comp.isOptimizable && comp.savings > 0)
          .sort((a, b) => b.savings - a.savings)[0];

        if (bestOption) {
          return {
            optimizationAvailable: true,
            potentialSavings: bestOption.savings,
            recommendedAction: `Switch to ${bestOption.carrier} ${bestOption.service} to save $${bestOption.savings.toFixed(2)}`
          };
        }
      }

      // No optimization opportunities found
      return {
        optimizationAvailable: false,
        potentialSavings: 0,
        recommendedAction: shipment ? 'No optimization opportunities available' : 'Shipment not found'
      };

    } catch (error) {
      console.error(`❌ Label optimization check failed:`, error);
      return {
        optimizationAvailable: false,
        potentialSavings: 0,
        recommendedAction: 'Error checking optimization'
      };
    }
  }

  /**
   * Get comprehensive shipping status including investment status
   */
  async getShippingStatus(itemId: string): Promise<ShippingStatus> {
    console.log(`📊 Getting shipping status for item: ${itemId}`);

    try {
      // Get basic shipping status
      const basicStatus = this.getBasicShippingStatus(itemId);

      // Get investment status
      const investmentStatus = await this.investmentService.getInvestmentStatus(itemId);

      // Check optimization opportunities
      const optimizationCheck = await this.checkLabelOptimization(`ship_${itemId}`);

      return {
        itemId,
        status: basicStatus.status,
        trackingNumber: basicStatus.trackingNumber,
        estimatedDelivery: basicStatus.estimatedDelivery,
        cost: basicStatus.cost,
        optimizationOpportunities: {
          available: optimizationCheck.optimizationAvailable,
          potentialSavings: optimizationCheck.potentialSavings,
          recommendedCarrier: optimizationCheck.recommendedAction.includes('Switch to') 
            ? optimizationCheck.recommendedAction.split('Switch to ')[1]?.split(' ')[0]
            : undefined
        },
        investmentStatus: {
          insuranceHoldInvestable: investmentStatus.holdBalance.insuranceHold > 0,
          totalInvestableHolds: investmentStatus.holdBalance.totalInvestable
        }
      };

    } catch (error) {
      console.error(`❌ Failed to get shipping status:`, error);
      return {
        itemId,
        status: 'pending',
        cost: 0,
        optimizationOpportunities: {
          available: false,
          potentialSavings: 0
        },
        investmentStatus: {
          insuranceHoldInvestable: false,
          totalInvestableHolds: 0
        }
      };
    }
  }

  /**
   * Update shipping preferences
   */
  async updateShippingPreferences(userId: string, preferences: Partial<ShippingPreferences>): Promise<ShippingPreferences> {
    console.log(`⚙️ Updating shipping preferences for user: ${userId}`);

    const currentPreferences: ShippingPreferences = {
      userId,
      autoOptimizationEnabled: true,
      carrierPreferences: ['USPS', 'UPS', 'FedEx'],
      insurancePreferences: {
        autoInsure: true,
        minValueThreshold: 100
      }
    };

    const updatedPreferences = { ...currentPreferences, ...preferences };

    // Update ShipStation optimization settings
    await this.shipStationService.updateOptimizationSettings(userId, {
      autoReinvestEnabled: updatedPreferences.autoOptimizationEnabled,
      minSavingsThreshold: 1.00, // Default minimum savings
      preferredCarriers: updatedPreferences.carrierPreferences
    });

    console.log(`✅ Shipping preferences updated:`, updatedPreferences);
    return updatedPreferences;
  }

  /**
   * Trigger insurance hold investment (called by InvestmentService)
   */
  async triggerInsuranceHoldInvestment(itemId: string): Promise<void> {
    console.log(`🛡️ Triggering insurance hold investment for item: ${itemId}`);
    
    // This method is called by InvestmentService when item ships
    // The actual investment logic is handled by InvestmentService
    console.log(`✅ Insurance holds are now investable for item: ${itemId}`);
  }

  // Helper methods

  /**
   * Update shipping status
   */
  private async updateShippingStatus(itemId: string, status: 'pending' | 'shipped' | 'delivered' | 'returned', trackingNumber?: string): Promise<any> {
    // Mock implementation - in production, this would update database
    return {
      itemId,
      status,
      trackingNumber,
      updatedAt: new Date().toISOString()
    };
  }

  /**
   * Send shipping notifications
   */
  private async sendShippingNotifications(itemId: string, trackingNumber: string): Promise<void> {
    console.log(`📧 Sending shipping notifications for item: ${itemId}`);
    // Mock implementation - in production, this would send actual notifications
  }

  /**
   * Get basic shipping status
   */
  private getBasicShippingStatus(itemId: string): {
    status: 'pending' | 'shipped' | 'delivered' | 'returned';
    trackingNumber?: string;
    estimatedDelivery?: string;
    cost: number;
  } {
    // Mock implementation - in production, this would query actual shipping data
    return {
      status: 'shipped',
      trackingNumber: `TRK${itemId}`,
      estimatedDelivery: '2-3 business days',
      cost: 15.50
    };
  }
}

