/**
 * ShipStation Service
 * Handles ShipStation API integration for rate comparison, optimization, and carefree reinvestment
 */

export interface Shipment {
  id: string;
  itemId: string;
  carrier: string;
  service: string;
  rate: number;
  trackingNumber?: string;
  labelId?: string;
  createdAt: string;
}

export interface RateComparison {
  shipmentId: string;
  originalRate: number;
  optimizedRate: number;
  savings: number;
  carrier: string;
  service: string;
  refundPolicy: 'free' | 'paid';
  isOptimizable: boolean;
}

export interface OptimizationResult {
  success: boolean;
  originalRate: number;
  optimizedRate: number;
  savings: number;
  refundProcessed: boolean;
  reinvestmentTriggered: boolean;
  reinvestmentAmount: number;
  message: string;
}

export interface OptimizationSettings {
  userId: string;
  autoReinvestEnabled: boolean;
  minSavingsThreshold: number;
  preferredCarriers: string[];
  lastUpdated: string;
}

export class ShipStationService {
  private static instance: ShipStationService;
  private shipments: Map<string, Shipment> = new Map();
  private optimizationSettings: Map<string, OptimizationSettings> = new Map();

  static getInstance(): ShipStationService {
    if (!ShipStationService.instance) {
      ShipStationService.instance = new ShipStationService();
    }
    return ShipStationService.instance;
  }

  constructor() {
    this.initializeMockData();
    console.log('📮 ShipStation Service initialized');
  }

  /**
   * Initialize mock data for development
   */
  private initializeMockData(): void {
    // Mock shipments
    const mockShipments: Shipment[] = [
      {
        id: 'ship_001',
        itemId: 'item_001',
        carrier: 'USPS',
        service: 'Priority Mail',
        rate: 15.50,
        trackingNumber: '9400128206212345678901',
        labelId: 'label_001',
        createdAt: new Date().toISOString()
      },
      {
        id: 'ship_002',
        itemId: 'item_002',
        carrier: 'UPS',
        service: 'Ground',
        rate: 20.00,
        trackingNumber: '1Z999AA1234567890',
        labelId: 'label_002',
        createdAt: new Date().toISOString()
      }
    ];

    mockShipments.forEach(shipment => {
      this.shipments.set(shipment.id, shipment);
    });

    // Mock optimization settings
    const defaultSettings: OptimizationSettings = {
      userId: 'user_default',
      autoReinvestEnabled: true,
      minSavingsThreshold: 1.00,
      preferredCarriers: ['USPS', 'UPS', 'FedEx'],
      lastUpdated: new Date().toISOString()
    };

    this.optimizationSettings.set('user_default', defaultSettings);
  }

  /**
   * Compare rates across carriers for a shipment
   */
  async compareRates(shipment: Shipment): Promise<RateComparison[]> {
    console.log(`🔍 Comparing rates for shipment: ${shipment.id}`);

    // Mock rate comparison - in production, this would call ShipStation API
    const mockRates = [
      {
        carrier: 'USPS',
        service: 'Priority Mail',
        rate: 15.50
      },
      {
        carrier: 'UPS',
        service: 'Ground',
        rate: 18.75
      },
      {
        carrier: 'FedEx',
        service: 'Ground',
        rate: 19.25
      },
      {
        carrier: 'DHL',
        service: 'Express',
        rate: 25.00
      }
    ];

    const comparisons = await Promise.all(
      mockRates.map(async (rate) => {
        const savings = shipment.rate - rate.rate;
        const isOptimizable = savings > 0 && await this.isRefundFree(rate.carrier, shipment.labelId || '');
        
        return {
          shipmentId: shipment.id,
          originalRate: shipment.rate,
          optimizedRate: rate.rate,
          savings: Math.max(0, savings),
          carrier: rate.carrier,
          service: rate.service,
          refundPolicy: (isOptimizable ? 'free' : 'paid') as 'free' | 'paid',
          isOptimizable
        };
      })
    );

    console.log(`✅ Rate comparison complete: ${comparisons.length} options`);
    return comparisons;
  }

  /**
   * Check if shipping label refunds are free for a carrier
   */
  async isRefundFree(carrier: string, labelId: string): Promise<boolean> {
    console.log(`💰 Checking refund policy for ${carrier} label: ${labelId}`);

    // Mock refund policies - in production, this would query carrier APIs
    const refundPolicies: { [key: string]: boolean } = {
      'USPS': true,    // Free refunds
      'UPS': true,     // Free refunds
      'FedEx': false,  // Paid refunds
      'DHL': false     // Paid refunds
    };

    const isFree = refundPolicies[carrier] || false;
    console.log(`📋 Refund policy for ${carrier}: ${isFree ? 'Free' : 'Paid'}`);
    return isFree;
  }

  /**
   * Optimize shipping label (only if refund is free and rate is lower)
   */
  async optimizeShippingLabel(shipmentId: string): Promise<OptimizationResult> {
    console.log(`⚡ Optimizing shipping label for shipment: ${shipmentId}`);

    const shipment = this.shipments.get(shipmentId);
    if (!shipment) {
      return {
        success: false,
        originalRate: 0,
        optimizedRate: 0,
        savings: 0,
        refundProcessed: false,
        reinvestmentTriggered: false,
        reinvestmentAmount: 0,
        message: 'Shipment not found'
      };
    }

    // Get rate comparisons
    const comparisons = await this.compareRates(shipment);
    
    // Find best optimization opportunity
    const bestOption = comparisons
      .filter(comp => comp.isOptimizable && comp.savings > 0)
      .sort((a, b) => b.savings - a.savings)[0];

    if (!bestOption) {
      return {
        success: false,
        originalRate: shipment.rate,
        optimizedRate: shipment.rate,
        savings: 0,
        refundProcessed: false,
        reinvestmentTriggered: false,
        reinvestmentAmount: 0,
        message: 'No optimization opportunities found'
      };
    }

    // Check if savings meet minimum threshold
    const settings = await this.getOptimizationSettings('user_default');
    if (bestOption.savings < settings.minSavingsThreshold) {
      return {
        success: false,
        originalRate: shipment.rate,
        optimizedRate: bestOption.optimizedRate,
        savings: bestOption.savings,
        refundProcessed: false,
        reinvestmentTriggered: false,
        reinvestmentAmount: 0,
        message: `Savings ($${bestOption.savings.toFixed(2)}) below minimum threshold ($${settings.minSavingsThreshold.toFixed(2)})`
      };
    }

    // Process refund and reinvestment
    const refundResult = await this.refundAndReinvest(shipment.labelId || '', bestOption.optimizedRate);

    return {
      success: true,
      originalRate: shipment.rate,
      optimizedRate: bestOption.optimizedRate,
      savings: bestOption.savings,
      refundProcessed: refundResult.success,
      reinvestmentTriggered: refundResult.reinvestmentTriggered,
      reinvestmentAmount: refundResult.reinvestmentAmount,
      message: `Optimized to ${bestOption.carrier} ${bestOption.service} - saved $${bestOption.savings.toFixed(2)}`
    };
  }

  /**
   * Refund old label and purchase new one
   */
  async refundAndReinvest(labelId: string, newRate: number): Promise<{
    success: boolean;
    refundAmount: number;
    reinvestmentTriggered: boolean;
    reinvestmentAmount: number;
  }> {
    console.log(`💸 Processing refund and reinvestment for label: ${labelId}`);

    // Mock refund processing - in production, this would call carrier APIs
    const refundAmount = 15.50; // Mock refund amount
    const reinvestmentAmount = refundAmount - newRate;

    // Check if auto-reinvestment is enabled
    const settings = await this.getOptimizationSettings('user_default');
    const reinvestmentTriggered = settings.autoReinvestEnabled && reinvestmentAmount > 0;

    if (reinvestmentTriggered) {
      console.log(`💰 Triggering reinvestment: $${reinvestmentAmount.toFixed(2)}`);
      // In production, this would trigger investment through InvestmentService
      await this.triggerReinvestment(reinvestmentAmount);
    }

    return {
      success: true,
      refundAmount,
      reinvestmentTriggered,
      reinvestmentAmount
    };
  }

  /**
   * Trigger reinvestment of savings
   */
  private async triggerReinvestment(amount: number): Promise<void> {
    console.log(`📈 Triggering reinvestment: $${amount.toFixed(2)}`);
    
    // In production, this would integrate with InvestmentService
    // For now, just log the reinvestment
    console.log(`✅ Reinvestment triggered: $${amount.toFixed(2)}`);
  }

  /**
   * Get user's optimization settings
   */
  async getOptimizationSettings(userId: string): Promise<OptimizationSettings> {
    const settings = this.optimizationSettings.get(userId);
    
    if (!settings) {
      // Return default settings
      const defaultSettings: OptimizationSettings = {
        userId,
        autoReinvestEnabled: true,
        minSavingsThreshold: 1.00,
        preferredCarriers: ['USPS', 'UPS', 'FedEx'],
        lastUpdated: new Date().toISOString()
      };
      
      this.optimizationSettings.set(userId, defaultSettings);
      return defaultSettings;
    }

    return settings;
  }

  /**
   * Update user's optimization settings
   */
  async updateOptimizationSettings(userId: string, settings: Partial<OptimizationSettings>): Promise<OptimizationSettings> {
    console.log(`⚙️ Updating optimization settings for user: ${userId}`);

    const currentSettings = await this.getOptimizationSettings(userId);
    const updatedSettings: OptimizationSettings = {
      ...currentSettings,
      ...settings,
      userId,
      lastUpdated: new Date().toISOString()
    };

    this.optimizationSettings.set(userId, updatedSettings);
    
    console.log(`✅ Optimization settings updated:`, updatedSettings);
    return updatedSettings;
  }

  /**
   * Get shipment by ID
   */
  getShipment(shipmentId: string): Shipment | undefined {
    return this.shipments.get(shipmentId);
  }

  /**
   * Get all shipments for an item
   */
  getShipmentsForItem(itemId: string): Shipment[] {
    return Array.from(this.shipments.values())
      .filter(shipment => shipment.itemId === itemId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Create a new shipment
   */
  async createShipment(itemId: string, carrier: string, service: string, rate: number): Promise<Shipment> {
    const shipment: Shipment = {
      id: `ship_${Date.now()}`,
      itemId,
      carrier,
      service,
      rate,
      createdAt: new Date().toISOString()
    };

    this.shipments.set(shipment.id, shipment);
    console.log(`📦 Created shipment: ${shipment.id} for item: ${itemId}`);
    
    return shipment;
  }

  /**
   * Update shipment with tracking information
   */
  async updateShipmentTracking(shipmentId: string, trackingNumber: string, labelId: string): Promise<boolean> {
    const shipment = this.shipments.get(shipmentId);
    
    if (!shipment) {
      return false;
    }

    shipment.trackingNumber = trackingNumber;
    shipment.labelId = labelId;
    
    this.shipments.set(shipmentId, shipment);
    console.log(`📋 Updated tracking for shipment: ${shipmentId}`);
    
    return true;
  }

  /**
   * Get optimization history for a user
   */
  getOptimizationHistory(userId: string): OptimizationResult[] {
    // Mock optimization history - in production, this would query database
    return [
      {
        success: true,
        originalRate: 20.00,
        optimizedRate: 18.75,
        savings: 1.25,
        refundProcessed: true,
        reinvestmentTriggered: true,
        reinvestmentAmount: 1.25,
        message: 'Optimized to UPS Ground - saved $1.25'
      },
      {
        success: true,
        originalRate: 15.50,
        optimizedRate: 14.25,
        savings: 1.25,
        refundProcessed: true,
        reinvestmentTriggered: true,
        reinvestmentAmount: 1.25,
        message: 'Optimized to USPS Priority - saved $1.25'
      }
    ];
  }

  /**
   * Check if shipment is eligible for optimization
   */
  async isEligibleForOptimization(shipmentId: string): Promise<{
    eligible: boolean;
    reason: string;
    potentialSavings: number;
  }> {
    const shipment = this.shipments.get(shipmentId);
    
    if (!shipment) {
      return {
        eligible: false,
        reason: 'Shipment not found',
        potentialSavings: 0
      };
    }

    const comparisons = await this.compareRates(shipment);
    const bestOption = comparisons
      .filter(comp => comp.isOptimizable && comp.savings > 0)
      .sort((a, b) => b.savings - a.savings)[0];

    if (!bestOption) {
      return {
        eligible: false,
        reason: 'No optimization opportunities available',
        potentialSavings: 0
      };
    }

    const settings = await this.getOptimizationSettings('user_default');
    const meetsThreshold = bestOption.savings >= settings.minSavingsThreshold;

    return {
      eligible: meetsThreshold,
      reason: meetsThreshold 
        ? `Optimization available with ${bestOption.carrier}`
        : `Savings below minimum threshold ($${settings.minSavingsThreshold.toFixed(2)})`,
      potentialSavings: bestOption.savings
    };
  }
}

export default ShipStationService;