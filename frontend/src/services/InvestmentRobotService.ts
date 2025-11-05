/**
 * Investment Robot Service
 * Provides automated monitoring, stop-loss, and emergency withdrawal for risky investments
 */

import { InvestmentService } from './InvestmentService';
import { WalletService } from './WalletService';

export interface InvestmentRobot {
  id: string;
  itemId: string;
  investmentId: string;
  initialValue: number;
  stopLossThreshold: number;
  riskTolerance: number;
  isActive: boolean;
  createdAt: string;
  lastChecked: string;
}

export interface RobotStatus {
  itemId: string;
  robotActive: boolean;
  currentValue: number;
  stopLossTriggered: boolean;
  withdrawalAttempted: boolean;
  lastCheckTime: string;
}

export interface MarketAlert {
  type: 'volatility' | 'downturn' | 'recovery';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: string;
}

export class InvestmentRobotService {
  private static instance: InvestmentRobotService;
  private investmentService: InvestmentService;
  private walletService: WalletService;
  private robots: Map<string, InvestmentRobot> = new Map();
  private marketAlerts: MarketAlert[] = [];

  static getInstance(): InvestmentRobotService {
    if (!InvestmentRobotService.instance) {
      InvestmentRobotService.instance = new InvestmentRobotService();
    }
    return InvestmentRobotService.instance;
  }

  constructor() {
    this.investmentService = InvestmentService.getInstance();
    this.walletService = WalletService.getInstance();
    console.log('🤖 Investment Robot Service initialized');
  }

  /**
   * Activate robot monitoring for an item
   */
  async activateRobotForItem(itemId: string, investmentId: string): Promise<InvestmentRobot> {
    console.log(`🤖 Activating investment robot for item: ${itemId}`);

    const robot: InvestmentRobot = {
      id: `robot_${Date.now()}`,
      itemId,
      investmentId,
      initialValue: 1000, // Mock initial value
      stopLossThreshold: 0.15, // 15% stop-loss
      riskTolerance: 0.20, // 20% risk tolerance
      isActive: true,
      createdAt: new Date().toISOString(),
      lastChecked: new Date().toISOString()
    };

    this.robots.set(robot.id, robot);

    // Start monitoring
    this.startMonitoring(robot.id);

    console.log(`✅ Investment robot activated: ${robot.id}`);
    return robot;
  }

  /**
   * Monitor investment value and check for descent
   */
  async monitorInvestment(investmentId: string): Promise<{
    currentValue: number;
    descentDetected: boolean;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    actionRequired: boolean;
  }> {
    console.log(`📊 Monitoring investment: ${investmentId}`);

    // Mock investment value monitoring
    const initialValue = 1000;
    const currentValue = this.simulateMarketValue(initialValue);
    const descentPercentage = (initialValue - currentValue) / initialValue;

    let descentDetected = false;
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let actionRequired = false;

    if (descentPercentage > 0.05) { // 5% descent
      descentDetected = true;
      
      if (descentPercentage > 0.20) {
        riskLevel = 'critical';
        actionRequired = true;
      } else if (descentPercentage > 0.15) {
        riskLevel = 'high';
        actionRequired = true;
      } else if (descentPercentage > 0.10) {
        riskLevel = 'medium';
      }
    }

    // Check if descent would place investment at risk within potential pull-out period
    const pullOutPeriod = this.calculatePullOutPeriod(descentPercentage);
    if (pullOutPeriod < 24) { // Less than 24 hours
      actionRequired = true;
    }

    return {
      currentValue,
      descentDetected,
      riskLevel,
      actionRequired
    };
  }

  /**
   * Calculate stop-loss threshold
   */
  calculateStopLoss(initialValue: number, riskTolerance: number): number {
    return initialValue * (1 - riskTolerance);
  }

  /**
   * Attempt emergency withdrawal
   */
  async attemptWithdrawal(investmentId: string): Promise<{
    success: boolean;
    withdrawalAmount: number;
    withdrawalWindow: boolean;
    falloutTriggered: boolean;
  }> {
    console.log(`🚨 Attempting emergency withdrawal for investment: ${investmentId}`);

    // Check if withdrawal window is available
    const withdrawalWindow = this.checkWithdrawalWindow(investmentId);
    
    if (!withdrawalWindow) {
      console.log(`❌ Withdrawal window not available for investment: ${investmentId}`);
      return {
        success: false,
        withdrawalAmount: 0,
        withdrawalWindow: false,
        falloutTriggered: true
      };
    }

    // Execute withdrawal
    const withdrawalAmount = await this.executeWithdrawal(investmentId);
    
    if (withdrawalAmount > 0) {
      console.log(`✅ Emergency withdrawal successful: $${withdrawalAmount.toFixed(2)}`);
      return {
        success: true,
        withdrawalAmount,
        withdrawalWindow: true,
        falloutTriggered: false
      };
    } else {
      console.log(`❌ Withdrawal failed - triggering fallout scenario`);
      return {
        success: false,
        withdrawalAmount: 0,
        withdrawalWindow: true,
        falloutTriggered: true
      };
    }
  }

  /**
   * Get robot monitoring status for an item
   */
  async getRobotStatus(itemId: string): Promise<RobotStatus> {
    const robot = Array.from(this.robots.values()).find(r => r.itemId === itemId);
    
    if (!robot) {
      return {
        itemId,
        robotActive: false,
        currentValue: 0,
        stopLossTriggered: false,
        withdrawalAttempted: false,
        lastCheckTime: new Date().toISOString()
      };
    }

    const monitoring = await this.monitorInvestment(robot.investmentId);
    const stopLossThreshold = this.calculateStopLoss(robot.initialValue, robot.riskTolerance);
    const stopLossTriggered = monitoring.currentValue <= stopLossThreshold;

    return {
      itemId,
      robotActive: robot.isActive,
      currentValue: monitoring.currentValue,
      stopLossTriggered,
      withdrawalAttempted: false, // Would track actual withdrawal attempts
      lastCheckTime: robot.lastChecked
    };
  }

  /**
   * Deactivate robot monitoring
   */
  async deactivateRobot(itemId: string): Promise<boolean> {
    console.log(`🛑 Deactivating robot for item: ${itemId}`);

    const robot = Array.from(this.robots.values()).find(r => r.itemId === itemId);
    
    if (robot) {
      robot.isActive = false;
      this.robots.set(robot.id, robot);
      console.log(`✅ Robot deactivated for item: ${itemId}`);
      return true;
    }

    return false;
  }

  /**
   * Process market alerts from Variable Flywheel Cron
   */
  async processMarketAlert(alert: MarketAlert): Promise<void> {
    console.log(`📈 Processing market alert: ${alert.type} - ${alert.severity}`);

    this.marketAlerts.push(alert);

    // If critical alert, check all active robots
    if (alert.severity === 'critical') {
      await this.checkAllActiveRobots();
    }
  }

  /**
   * Coordinate with emergency protocols
   */
  async coordinateEmergencyProtocols(): Promise<void> {
    console.log(`🚨 Coordinating emergency protocols`);

    // Check all active robots for critical conditions
    const activeRobots = Array.from(this.robots.values()).filter(r => r.isActive);
    
    for (const robot of activeRobots) {
      const monitoring = await this.monitorInvestment(robot.investmentId);
      
      if (monitoring.actionRequired) {
        console.log(`⚠️ Emergency action required for robot: ${robot.id}`);
        await this.attemptWithdrawal(robot.investmentId);
      }
    }
  }

  /**
   * Share data with ML warehouse
   */
  async shareDataWithMLWarehouse(): Promise<void> {
    console.log(`📊 Sharing robot data with ML warehouse`);

    const robotData = Array.from(this.robots.values()).map(robot => ({
      robotId: robot.id,
      itemId: robot.itemId,
      initialValue: robot.initialValue,
      stopLossThreshold: robot.stopLossThreshold,
      riskTolerance: robot.riskTolerance,
      isActive: robot.isActive,
      createdAt: robot.createdAt,
      lastChecked: robot.lastChecked
    }));

    // In production, this would send data to ML warehouse
    console.log(`✅ Robot data shared with ML warehouse: ${robotData.length} robots`);
  }

  // Private helper methods

  /**
   * Start monitoring for a robot
   */
  private startMonitoring(robotId: string): void {
    const robot = this.robots.get(robotId);
    if (!robot) return;

    // Mock continuous monitoring - in production, this would use a scheduler
    const monitoringInterval = setInterval(async () => {
      if (!robot.isActive) {
        clearInterval(monitoringInterval);
        return;
      }

      const monitoring = await this.monitorInvestment(robot.investmentId);
      
      if (monitoring.actionRequired) {
        console.log(`🤖 Robot ${robotId} detected action required`);
        await this.attemptWithdrawal(robot.investmentId);
      }

      robot.lastChecked = new Date().toISOString();
      this.robots.set(robotId, robot);
    }, 30000); // Check every 30 seconds
  }

  /**
   * Simulate market value changes
   */
  private simulateMarketValue(initialValue: number): number {
    // Mock market simulation with some volatility
    const volatility = 0.05; // 5% volatility
    const randomChange = (Math.random() - 0.5) * 2 * volatility;
    return initialValue * (1 + randomChange);
  }

  /**
   * Calculate potential pull-out period
   */
  private calculatePullOutPeriod(descentPercentage: number): number {
    // Mock calculation - in production, this would use market data
    if (descentPercentage > 0.20) return 2; // 2 hours
    if (descentPercentage > 0.15) return 6; // 6 hours
    if (descentPercentage > 0.10) return 12; // 12 hours
    return 24; // 24 hours
  }

  /**
   * Check if withdrawal window is available
   */
  private checkWithdrawalWindow(investmentId: string): boolean {
    // Mock withdrawal window check - in production, this would check market hours
    const hour = new Date().getHours();
    return hour >= 9 && hour <= 17; // Market hours 9 AM - 5 PM
  }

  /**
   * Execute withdrawal
   */
  private async executeWithdrawal(investmentId: string): Promise<number> {
    // Mock withdrawal execution - in production, this would call actual investment APIs
    const withdrawalAmount = 950; // Mock withdrawal amount
    console.log(`💰 Executing withdrawal: $${withdrawalAmount.toFixed(2)}`);
    return withdrawalAmount;
  }

  /**
   * Check all active robots
   */
  private async checkAllActiveRobots(): Promise<void> {
    const activeRobots = Array.from(this.robots.values()).filter(r => r.isActive);
    
    for (const robot of activeRobots) {
      const monitoring = await this.monitorInvestment(robot.investmentId);
      
      if (monitoring.actionRequired) {
        console.log(`🚨 Critical condition detected for robot: ${robot.id}`);
        await this.attemptWithdrawal(robot.investmentId);
      }
    }
  }

  /**
   * Get all robots
   */
  getAllRobots(): InvestmentRobot[] {
    return Array.from(this.robots.values());
  }

  /**
   * Get market alerts
   */
  getMarketAlerts(): MarketAlert[] {
    return [...this.marketAlerts];
  }

  /**
   * Clear old market alerts
   */
  clearOldAlerts(): void {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    this.marketAlerts = this.marketAlerts.filter(alert => alert.timestamp > oneHourAgo);
  }
}

export default InvestmentRobotService;
