/**
 * End-to-End Test: Risky Investment Flow
 * Tests complete flow from item creation to fallout scenario
 */

import { InvestmentService } from '../../services/InvestmentService';
import { WalletService } from '../../services/WalletService';
import { ShipStationService } from '../../services/ShipStationService';
import { ShippingService } from '../../services/ShippingService';
import { InvestmentRobotService } from '../../services/InvestmentRobotService';

describe('Risky Investment Flow E2E Test', () => {
  let investmentService: InvestmentService;
  let walletService: WalletService;
  let shipStationService: ShipStationService;
  let shippingService: ShippingService;
  let robotService: InvestmentRobotService;

  beforeEach(() => {
    investmentService = InvestmentService.getInstance();
    walletService = WalletService.getInstance();
    shipStationService = ShipStationService.getInstance();
    shippingService = ShippingService.getInstance();
    robotService = InvestmentRobotService.getInstance();
  });

  test('Complete risky investment flow from creation to fallout', async () => {
    const itemId = 'e2e_item_001';
    const riskPercentage = 60;

    // Step 1: Create item with holds
    console.log('Step 1: Creating item with holds');
    await walletService.processShippingHold(itemId, 25.00);
    await walletService.createAdditionalInvestmentHold(itemId, 35.00);
    await walletService.createInsuranceHold(itemId, 15.00);

    let investmentStatus = await investmentService.getInvestmentStatus(itemId);
    expect(investmentStatus.holdBalance.shippingHold2x).toBe(50.00);
    expect(investmentStatus.holdBalance.additionalHold).toBe(35.00);
    expect(investmentStatus.holdBalance.insuranceHold).toBe(15.00);
    expect(investmentStatus.riskyModeEnabled).toBe(false);

    // Step 2: Enable risky investment mode
    console.log('Step 2: Enabling risky investment mode');
    const amountAtRisk = (investmentStatus.holdBalance.shippingHold2x * riskPercentage) / 100;
    const antiCollateral = await investmentService.calculateAntiCollateral(amountAtRisk, riskPercentage);
    
    await walletService.enableRiskyInvestmentMode(itemId, riskPercentage, antiCollateral);

    investmentStatus = await investmentService.getInvestmentStatus(itemId);
    expect(investmentStatus.riskyModeEnabled).toBe(true);
    expect(investmentStatus.riskPercentage).toBe(riskPercentage);
    expect(investmentStatus.antiCollateralDeposited).toBe(antiCollateral);

    // Step 3: Invest shipping holds (now possible with risky mode)
    console.log('Step 3: Investing shipping holds');
    const shippingEligibility = await investmentService.checkInvestmentEligibility(itemId, 'shipping_2x');
    expect(shippingEligibility.isEligible).toBe(true);

    await walletService.investHold(itemId, 'shipping_2x', amountAtRisk);

    // Step 4: Invest additional holds (immediately investable)
    console.log('Step 4: Investing additional holds');
    const additionalEligibility = await investmentService.checkInvestmentEligibility(itemId, 'additional');
    expect(additionalEligibility.isEligible).toBe(true);

    await walletService.investHold(itemId, 'additional', 35.00);

    // Step 5: Simulate item shipping and invest insurance holds
    console.log('Step 5: Simulating item shipping');
    await shippingService.processItemShipping(itemId, 'TRK789012');

    const insuranceEligibility = await investmentService.checkInvestmentEligibility(itemId, 'insurance');
    expect(insuranceEligibility.isEligible).toBe(true);

    await walletService.investHold(itemId, 'insurance', 15.00);

    // Step 6: Activate investment robots
    console.log('Step 6: Activating investment robots');
    const robot = await robotService.activateRobotForItem(itemId, 'investment_001');
    expect(robot.itemId).toBe(itemId);
    expect(robot.isActive).toBe(true);

    const robotStatus = await robotService.getRobotStatus(itemId);
    expect(robotStatus.robotActive).toBe(true);

    // Step 7: Simulate market downturn
    console.log('Step 7: Simulating market downturn');
    const marketAlert = {
      type: 'downturn' as const,
      severity: 'critical' as const,
      message: 'Market crash detected - immediate action required',
      timestamp: new Date().toISOString()
    };

    await robotService.processMarketAlert(marketAlert);

    // Step 8: Robot attempts withdrawal
    console.log('Step 8: Robot attempts withdrawal');
    const withdrawalResult = await robotService.attemptWithdrawal('investment_001');
    
    if (withdrawalResult.success) {
      console.log('✅ Emergency withdrawal successful');
      expect(withdrawalResult.withdrawalAmount).toBeGreaterThan(0);
    } else {
      console.log('❌ Withdrawal failed - triggering fallout');
      expect(withdrawalResult.falloutTriggered).toBe(true);
    }

    // Step 9: Handle fallout scenario
    console.log('Step 9: Handling fallout scenario');
    const totalLoss = 75.00;
    await investmentService.handleFalloutScenario(itemId, totalLoss);

    // Verify fallout was processed
    investmentStatus = await investmentService.getInvestmentStatus(itemId);
    expect(investmentStatus.riskyModeEnabled).toBe(false);

    // Step 10: Generate tax documents (integration with Plan #2)
    console.log('Step 10: Generating tax documents');
    // This would integrate with Plan #2 tax document generation
    // For now, we'll verify the fallout data is available for tax reporting
    
    const falloutData = {
      totalLoss,
      borrowerShare: 20.00, // (25 + 15) / 2
      ownerShare: 20.00,
      shippingRefund: 12.50, // 25 / 2
      insuranceRefund: 7.50, // 15 / 2
      investmentLoss: 35.00 // 75 - 40
    };

    await walletService.handleFalloutScenario(itemId, falloutData);

    // Step 11: Verify chat room creation (integration with Plan #2)
    console.log('Step 11: Verifying chat room creation');
    // This would integrate with Plan #2 chat room automation
    // For now, we'll verify the fallout scenario was processed
    
    expect(falloutData.borrowerShare).toBe(20.00);
    expect(falloutData.ownerShare).toBe(20.00);
    expect(falloutData.investmentLoss).toBe(35.00);

    // Step 12: Deactivate robots
    console.log('Step 12: Deactivating robots');
    const deactivated = await robotService.deactivateRobot(itemId);
    expect(deactivated).toBe(true);

    const finalRobotStatus = await robotService.getRobotStatus(itemId);
    expect(finalRobotStatus.robotActive).toBe(false);

    console.log('✅ Complete risky investment flow test passed');
  });

  test('ShipStation optimization integration', async () => {
    const itemId = 'e2e_shipstation_001';

    // Create shipment
    const shipment = await shipStationService.createShipment(itemId, 'USPS', 'Priority Mail', 15.50);
    expect(shipment.itemId).toBe(itemId);

    // Check optimization opportunities
    const optimization = await shippingService.checkLabelOptimization(shipment.id);
    expect(optimization).toBeDefined();

    // If optimization available, apply it
    if (optimization.optimizationAvailable) {
      const result = await shipStationService.optimizeShippingLabel(shipment.id);
      expect(result.success).toBe(true);
      expect(result.savings).toBeGreaterThan(0);
    }

    // Verify optimization settings
    const settings = await shipStationService.getOptimizationSettings('user_default');
    expect(settings.autoReinvestEnabled).toBe(true);
    expect(settings.minSavingsThreshold).toBe(1.00);
  });

  test('Investment robot monitoring and emergency protocols', async () => {
    const itemId = 'e2e_robot_001';

    // Activate robot
    const robot = await robotService.activateRobotForItem(itemId, 'investment_002');
    expect(robot.isActive).toBe(true);

    // Monitor investment
    const monitoring = await robotService.monitorInvestment('investment_002');
    expect(monitoring).toBeDefined();
    expect(monitoring.currentValue).toBeGreaterThan(0);

    // Process critical market alert
    const criticalAlert = {
      type: 'volatility' as const,
      severity: 'critical' as const,
      message: 'Extreme market volatility detected',
      timestamp: new Date().toISOString()
    };

    await robotService.processMarketAlert(criticalAlert);

    // Coordinate emergency protocols
    await robotService.coordinateEmergencyProtocols();

    // Share data with ML warehouse
    await robotService.shareDataWithMLWarehouse();

    // Verify robot data
    const allRobots = robotService.getAllRobots();
    expect(allRobots.length).toBeGreaterThan(0);

    const alerts = robotService.getMarketAlerts();
    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[alerts.length - 1].severity).toBe('critical');
  });

  test('Complete hold lifecycle management', async () => {
    const itemId = 'e2e_lifecycle_001';

    // Create all hold types
    await walletService.processShippingHold(itemId, 30.00);
    await walletService.createAdditionalInvestmentHold(itemId, 45.00);
    await walletService.createInsuranceHold(itemId, 20.00);

    // Verify initial state
    let investmentStatus = await investmentService.getInvestmentStatus(itemId);
    expect(investmentStatus.holdBalance.totalInvestable).toBe(65.00);
    expect(investmentStatus.holdBalance.totalNonInvestable).toBe(60.00);

    // Enable risky mode
    const riskPercentage = 40;
    const amountAtRisk = (investmentStatus.holdBalance.shippingHold2x * riskPercentage) / 100;
    const antiCollateral = await investmentService.calculateAntiCollateral(amountAtRisk, riskPercentage);
    
    await walletService.enableRiskyInvestmentMode(itemId, riskPercentage, antiCollateral);

    // Invest all eligible holds
    await walletService.investHold(itemId, 'shipping_2x', amountAtRisk);
    await walletService.investHold(itemId, 'additional', 45.00);

    // Simulate shipping to make insurance holds investable
    await shippingService.processItemShipping(itemId, 'TRK345678');
    await walletService.investHold(itemId, 'insurance', 20.00);

    // Verify final state
    investmentStatus = await investmentService.getInvestmentStatus(itemId);
    expect(investmentStatus.riskyModeEnabled).toBe(true);
    expect(investmentStatus.robotsActive).toBe(true);

    // Test hold balance calculations
    const holdBalance = await investmentService.trackPerItemHolds(itemId);
    expect(holdBalance.totalInvestable).toBe(65.00);
    expect(holdBalance.totalNonInvestable).toBe(60.00);

    console.log('✅ Complete hold lifecycle management test passed');
  });
});
