/**
 * Investment Service
 * Manages per-item hold tracking, investment eligibility, risky investment mode, and anti-collateral
 */

import { WalletService } from './WalletService';
import { ShippingService } from './ShippingService';

export interface HoldBalance {
  itemId: string;
  shippingHold2x: number;      // Non-investable (reserved for round-trip)
  additionalHold: number;      // Investable 3rd x hold
  insuranceHold: number;        // Investable after item ships
  totalInvestable: number;
  totalNonInvestable: number;
}

export interface InvestmentStatus {
  itemId: string;
  holdBalance: HoldBalance;
  riskyModeEnabled: boolean;
  riskPercentage: number;
  antiCollateralRequired: number;
  antiCollateralDeposited: number;
  currentInvestments: number;
  investmentReturn: number;
  investmentReturnPercentage: number;
  robotsActive: boolean;
  lastUpdated: string;
}

export interface RiskConfig {
  itemId: string;
  riskPercentage: number;       // 0-100% of 2x shipping hold
  antiCollateral: number;       // Required collateral
  amountAtRisk: number;         // Actual amount being invested
  riskBoundaryError: number;    // Current market risk assessment
}

export interface InvestmentEligibility {
  holdType: 'shipping_2x' | 'additional' | 'insurance';
  isEligible: boolean;
  reason: string;
  requirements: string[];
}

export class InvestmentService {
  private static instance: InvestmentService;
  private walletService: WalletService;
  private shippingService: ShippingService;
  private investmentStatuses: Map<string, InvestmentStatus> = new Map();
  private riskConfigs: Map<string, RiskConfig> = new Map();

  static getInstance(): InvestmentService {
    if (!InvestmentService.instance) {
      InvestmentService.instance = new InvestmentService();
    }
    return InvestmentService.instance;
  }

  constructor() {
    this.walletService = WalletService.getInstance();
    this.shippingService = ShippingService.getInstance();
    console.log('💰 Investment Service initialized');
  }

  /**
   * Track per-item holds (shipping 2x, additional, insurance)
   */
  async trackPerItemHolds(itemId: string): Promise<HoldBalance> {
    console.log(`📊 Tracking holds for item: ${itemId}`);

    // Get hold balances from wallet service
    const shippingHold2x = await this.walletService.getHoldBalance(itemId, 'shipping_hold_2x');
    const additionalHold = await this.walletService.getHoldBalance(itemId, 'additional_hold');
    const insuranceHold = await this.walletService.getHoldBalance(itemId, 'insurance_hold');

    const totalInvestable = additionalHold + insuranceHold;
    const totalNonInvestable = shippingHold2x;

    const holdBalance: HoldBalance = {
      itemId,
      shippingHold2x,
      additionalHold,
      insuranceHold,
      totalInvestable,
      totalNonInvestable
    };

    console.log(`✅ Hold balance tracked:`, holdBalance);
    return holdBalance;
  }

  /**
   * Check investment eligibility for specific hold type
   */
  async checkInvestmentEligibility(itemId: string, holdType: 'shipping_2x' | 'additional' | 'insurance'): Promise<InvestmentEligibility> {
    console.log(`🔍 Checking investment eligibility for ${holdType} on item: ${itemId}`);

    const shippingStatus = await this.shippingService.getShippingStatus(itemId);
    const riskyModeEnabled = this.isRiskyModeEnabled(itemId);

    switch (holdType) {
      case 'shipping_2x':
        return {
          holdType,
          isEligible: riskyModeEnabled,
          reason: riskyModeEnabled 
            ? 'Risky investment mode enabled' 
            : 'Shipping holds reserved for round-trip shipping',
          requirements: riskyModeEnabled 
            ? ['Anti-collateral deposited', 'Investment robots active']
            : ['Enable risky investment mode', 'Deposit anti-collateral']
        };

      case 'additional':
        return {
          holdType,
          isEligible: true,
          reason: 'Additional holds (3rd x) are immediately investable',
          requirements: []
        };

      case 'insurance':
        const isShipped = (shippingStatus as any).status === 'shipped' || (shippingStatus as any).status === 'delivered';
        return {
          holdType,
          isEligible: isShipped,
          reason: isShipped 
            ? 'Item has shipped - insurance hold now investable'
            : 'Insurance holds investable only after item ships',
          requirements: isShipped 
            ? []
            : ['Wait for item to ship']
        };

      default:
        return {
          holdType,
          isEligible: false,
          reason: 'Unknown hold type',
          requirements: ['Valid hold type required']
        };
    }
  }

  /**
   * Enable risky investment mode with anti-collateral
   */
  async enableRiskyInvestmentMode(itemId: string, riskPercentage: number, antiCollateral: number): Promise<RiskConfig> {
    console.log(`⚠️ Enabling risky investment mode for item: ${itemId}`);

    // Validate risk percentage (0-100%)
    if (riskPercentage < 0 || riskPercentage > 100) {
      throw new Error('Risk percentage must be between 0 and 100');
    }

    // Get current hold balance
    const holdBalance = await this.trackPerItemHolds(itemId);
    
    // Calculate amount at risk
    const amountAtRisk = (holdBalance.shippingHold2x * riskPercentage) / 100;

    // Calculate risk boundary error
    const riskBoundaryError = await this.getRiskBoundaryError();

    // Validate anti-collateral = opposite of risk boundary error
    const expectedAntiCollateral = amountAtRisk * riskBoundaryError;
    if (Math.abs(antiCollateral - expectedAntiCollateral) > 0.01) {
      throw new Error(`Anti-collateral must equal opposite of risk boundary error. Expected: $${expectedAntiCollateral.toFixed(2)}, Provided: $${antiCollateral.toFixed(2)}`);
    }

    // Create risk configuration
    const riskConfig: RiskConfig = {
      itemId,
      riskPercentage,
      antiCollateral,
      amountAtRisk,
      riskBoundaryError
    };

    // Store risk configuration
    this.riskConfigs.set(itemId, riskConfig);

    // Enable risky mode in wallet service
    const walletId = 'wallet_001'; // Default wallet
    await this.walletService.enableRiskyInvestmentMode(walletId, itemId, riskPercentage, antiCollateral);

    // Activate investment robots
    await this.activateInvestmentRobots(itemId);

    console.log(`✅ Risky investment mode enabled:`, riskConfig);
    return riskConfig;
  }

  /**
   * Calculate required anti-collateral for risky investment
   */
  async calculateAntiCollateral(investmentAmount: number, riskPercentage: number): Promise<number> {
    const riskBoundaryError = await this.getRiskBoundaryError();
    return investmentAmount * riskBoundaryError;
  }

  /**
   * Get complete investment status for display
   */
  async getInvestmentStatus(itemId: string): Promise<InvestmentStatus> {
    console.log(`📈 Getting investment status for item: ${itemId}`);

    const holdBalance = await this.trackPerItemHolds(itemId);
    const riskyModeEnabled = this.isRiskyModeEnabled(itemId);
    const riskConfig = this.riskConfigs.get(itemId);

    // Get current investments
    const currentInvestments = await this.getCurrentInvestments(itemId);
    
    // Calculate investment return
    const investmentReturn = await this.calculateInvestmentReturn(itemId);
    const investmentReturnPercentage = currentInvestments > 0 
      ? (investmentReturn / currentInvestments) * 100 
      : 0;

    // Check if robots are active
    const robotsActive = await this.areInvestmentRobotsActive(itemId);

    const investmentStatus: InvestmentStatus = {
      itemId,
      holdBalance,
      riskyModeEnabled,
      riskPercentage: riskConfig?.riskPercentage || 0,
      antiCollateralRequired: riskConfig?.antiCollateral || 0,
      antiCollateralDeposited: riskConfig?.antiCollateral || 0,
      currentInvestments,
      investmentReturn,
      investmentReturnPercentage,
      robotsActive,
      lastUpdated: new Date().toISOString()
    };

    // Cache the status
    this.investmentStatuses.set(itemId, investmentStatus);

    console.log(`✅ Investment status retrieved:`, investmentStatus);
    return investmentStatus;
  }

  /**
   * Get current risk boundary error based on market conditions
   */
  async getRiskBoundaryError(): Promise<number> {
    // In production, this would query market data and calculate risk
    // For now, return a mock value based on current market conditions
    const mockMarketVolatility = 0.15; // 15% volatility
    const riskBoundaryError = Math.min(mockMarketVolatility, 0.25); // Cap at 25%
    
    console.log(`📊 Risk boundary error calculated: ${(riskBoundaryError * 100).toFixed(2)}%`);
    return riskBoundaryError;
  }

  /**
   * Check if risky mode is enabled for an item
   */
  private isRiskyModeEnabled(itemId: string): boolean {
    return this.riskConfigs.has(itemId);
  }

  /**
   * Activate investment robots for monitoring
   */
  private async activateInvestmentRobots(itemId: string): Promise<void> {
    console.log(`🤖 Activating investment robots for item: ${itemId}`);
    
    // In production, this would integrate with InvestmentRobotService
    // For now, just log the activation
    console.log(`✅ Investment robots activated for item: ${itemId}`);
  }

  /**
   * Get current investments for an item
   */
  private async getCurrentInvestments(itemId: string): Promise<number> {
    // In production, this would query actual investment data
    // For now, return mock data
    return 150.00; // Mock investment amount
  }

  /**
   * Calculate investment return for an item
   */
  private async calculateInvestmentReturn(itemId: string): Promise<number> {
    // In production, this would calculate actual returns
    // For now, return mock data
    return 15.00; // Mock return amount
  }

  /**
   * Check if investment robots are active for an item
   */
  private async areInvestmentRobotsActive(itemId: string): Promise<boolean> {
    // In production, this would check actual robot status
    // For now, return true if risky mode is enabled
    return this.isRiskyModeEnabled(itemId);
  }

  /**
   * Get all investment statuses
   */
  getAllInvestmentStatuses(): InvestmentStatus[] {
    return Array.from(this.investmentStatuses.values());
  }

  /**
   * Get risk configuration for an item
   */
  getRiskConfig(itemId: string): RiskConfig | undefined {
    return this.riskConfigs.get(itemId);
  }

  /**
   * Disable risky investment mode
   */
  async disableRiskyInvestmentMode(itemId: string): Promise<void> {
    console.log(`🛑 Disabling risky investment mode for item: ${itemId}`);

    // Remove risk configuration
    this.riskConfigs.delete(itemId);

    // Deactivate investment robots
    await this.deactivateInvestmentRobots(itemId);

    // Update wallet service
    await this.walletService.disableRiskyInvestmentMode(itemId);

    console.log(`✅ Risky investment mode disabled for item: ${itemId}`);
  }

  /**
   * Deactivate investment robots
   */
  private async deactivateInvestmentRobots(itemId: string): Promise<void> {
    console.log(`🤖 Deactivating investment robots for item: ${itemId}`);
    
    // In production, this would integrate with InvestmentRobotService
    console.log(`✅ Investment robots deactivated for item: ${itemId}`);
  }

  /**
   * Handle fallout scenario (called by WalletService)
   */
  async handleFalloutScenario(itemId: string, investmentLoss: number): Promise<void> {
    console.log(`💥 Handling fallout scenario for item: ${itemId}, loss: $${investmentLoss}`);

    // Get risk configuration
    const riskConfig = this.riskConfigs.get(itemId);
    if (!riskConfig) {
      console.warn(`No risk configuration found for item: ${itemId}`);
      return;
    }

    // Calculate 50/50 split for shipping + insurance costs
    const holdBalance = await this.trackPerItemHolds(itemId);
    const shippingCost = holdBalance.shippingHold2x / 2; // Half of 2x shipping
    const insuranceCost = holdBalance.insuranceHold;
    const totalCosts = shippingCost + insuranceCost;
    
    const borrowerShare = totalCosts / 2;
    const ownerShare = totalCosts / 2;

    // Process fallout in wallet service
    const borrowerWalletId = 'wallet_001'; // Default wallet for borrower
    const ownerWalletId = 'wallet_002'; // Default wallet for owner
    await this.walletService.handleFalloutScenario(
      itemId,
      borrowerWalletId,
      ownerWalletId,
      investmentLoss,
      shippingCost / 2,
      insuranceCost / 2
    );

    // Deactivate risky mode
    await this.disableRiskyInvestmentMode(itemId);

    console.log(`✅ Fallout scenario handled:`, {
      totalLoss: investmentLoss,
      borrowerShare,
      ownerShare,
      shippingRefund: shippingCost / 2,
      insuranceRefund: insuranceCost / 2
    });
  }
}

export default InvestmentService;