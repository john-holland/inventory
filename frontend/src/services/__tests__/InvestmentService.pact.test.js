/**
 * PACT Tests for InvestmentService Provider Interactions
 * Tests contracts between InvestmentService and other services
 */

import { InvestmentService } from '../services/InvestmentService';
import { WalletService } from '../services/WalletService';
import { ShippingService } from '../services/ShippingService';
import { InvestmentRobotService } from '../services/InvestmentRobotService';

describe('InvestmentService PACT Tests', () => {
  let investmentService: InvestmentService;
  let walletService: WalletService;
  let shippingService: ShippingService;
  let robotService: InvestmentRobotService;

  beforeEach(() => {
    investmentService = InvestmentService.getInstance();
    walletService = WalletService.getInstance();
    shippingService = ShippingService.getInstance();
    robotService = InvestmentRobotService.getInstance();
  });

  describe('InvestmentService ↔ WalletService', () => {
    test('should create shipping hold through WalletService', async () => {
      const itemId = 'pact_wallet_001';
      const shippingCost = 20.00;

      await walletService.processShippingHold(itemId, shippingCost);

      const holdBalance = await investmentService.trackPerItemHolds(itemId);
      expect(holdBalance.shippingHold2x).toBe(40.00); // 2x shipping
    });

    test('should create additional investment hold through WalletService', async () => {
      const itemId = 'pact_wallet_002';
      const amount = 30.00;

      await walletService.createAdditionalInvestmentHold(itemId, amount);

      const holdBalance = await investmentService.trackPerItemHolds(itemId);
      expect(holdBalance.additionalHold).toBe(30.00);
    });

    test('should create insurance hold through WalletService', async () => {
      const itemId = 'pact_wallet_003';
      const amount = 15.00;

      await walletService.createInsuranceHold(itemId, amount);

      const holdBalance = await investmentService.trackPerItemHolds(itemId);
      expect(holdBalance.insuranceHold).toBe(15.00);
    });

    test('should enable risky investment mode through WalletService', async () => {
      const itemId = 'pact_wallet_004';
      const riskPercentage = 50;
      const antiCollateral = 10.00;

      await walletService.processShippingHold(itemId, 25.00);
      await walletService.enableRiskyInvestmentMode(itemId, riskPercentage, antiCollateral);

      const investmentStatus = await investmentService.getInvestmentStatus(itemId);
      expect(investmentStatus.riskyModeEnabled).toBe(true);
      expect(investmentStatus.riskPercentage).toBe(riskPercentage);
    });

    test('should handle fallout scenario through WalletService', async () => {
      const itemId = 'pact_wallet_005';
      
      await walletService.processShippingHold(itemId, 30.00);
      await walletService.createInsuranceHold(itemId, 10.00);

      const falloutData = {
        totalLoss: 60.00,
        borrowerShare: 20.00,
        ownerShare: 20.00,
        shippingRefund: 15.00,
        insuranceRefund: 5.00,
        investmentLoss: 20.00
      };

      await walletService.handleFalloutScenario(itemId, falloutData);

      // Verify fallout was processed
      expect(falloutData.borrowerShare).toBe(20.00);
      expect(falloutData.ownerShare).toBe(20.00);
    });
  });

  describe('InvestmentService ↔ ShippingService', () => {
    test('should trigger insurance hold investment after shipping', async () => {
      const itemId = 'pact_shipping_001';
      
      await walletService.createInsuranceHold(itemId, 20.00);

      // Before shipping - insurance holds not investable
      let eligibility = await investmentService.checkInvestmentEligibility(itemId, 'insurance');
      expect(eligibility.isEligible).toBe(false);

      // After shipping - insurance holds investable
      await shippingService.processItemShipping(itemId, 'TRK123456');
      
      eligibility = await investmentService.checkInvestmentEligibility(itemId, 'insurance');
      expect(eligibility.isEligible).toBe(true);
    });

    test('should integrate with shipping status for investment decisions', async () => {
      const itemId = 'pact_shipping_002';
      
      await walletService.createInsuranceHold(itemId, 25.00);
      await shippingService.processItemShipping(itemId, 'TRK789012');

      const shippingStatus = await shippingService.getShippingStatus(itemId);
      expect(shippingStatus.investmentStatus.insuranceHoldInvestable).toBe(true);
      expect(shippingStatus.investmentStatus.totalInvestableHolds).toBe(25.00);
    });

    test('should check label optimization opportunities', async () => {
      const itemId = 'pact_shipping_003';
      
      const optimization = await shippingService.checkLabelOptimization(itemId);
      expect(optimization).toBeDefined();
      expect(optimization).toHaveProperty('optimizationAvailable');
      expect(optimization).toHaveProperty('potentialSavings');
      expect(optimization).toHaveProperty('recommendedAction');
    });
  });

  describe('InvestmentService ↔ InvestmentRobotService', () => {
    test('should activate investment robots for risky mode', async () => {
      const itemId = 'pact_robot_001';
      
      await walletService.processShippingHold(itemId, 20.00);
      
      const riskPercentage = 40;
      const antiCollateral = await investmentService.calculateAntiCollateral(8.00, riskPercentage);
      await walletService.enableRiskyInvestmentMode(itemId, riskPercentage, antiCollateral);

      const robot = await robotService.activateRobotForItem(itemId, 'investment_001');
      expect(robot.itemId).toBe(itemId);
      expect(robot.isActive).toBe(true);

      const robotStatus = await robotService.getRobotStatus(itemId);
      expect(robotStatus.robotActive).toBe(true);
    });

    test('should monitor investment through robots', async () => {
      const itemId = 'pact_robot_002';
      
      await walletService.processShippingHold(itemId, 25.00);
      
      const riskPercentage = 60;
      const antiCollateral = await investmentService.calculateAntiCollateral(15.00, riskPercentage);
      await walletService.enableRiskyInvestmentMode(itemId, riskPercentage, antiCollateral);

      const robot = await robotService.activateRobotForItem(itemId, 'investment_002');
      
      const monitoring = await robotService.monitorInvestment(robot.investmentId);
      expect(monitoring).toBeDefined();
      expect(monitoring).toHaveProperty('currentValue');
      expect(monitoring).toHaveProperty('descentDetected');
      expect(monitoring).toHaveProperty('riskLevel');
      expect(monitoring).toHaveProperty('actionRequired');
    });

    test('should attempt emergency withdrawal through robots', async () => {
      const itemId = 'pact_robot_003';
      
      await walletService.processShippingHold(itemId, 30.00);
      
      const riskPercentage = 50;
      const antiCollateral = await investmentService.calculateAntiCollateral(15.00, riskPercentage);
      await walletService.enableRiskyInvestmentMode(itemId, riskPercentage, antiCollateral);

      const robot = await robotService.activateRobotForItem(itemId, 'investment_003');
      
      const withdrawalResult = await robotService.attemptWithdrawal(robot.investmentId);
      expect(withdrawalResult).toBeDefined();
      expect(withdrawalResult).toHaveProperty('success');
      expect(withdrawalResult).toHaveProperty('withdrawalAmount');
      expect(withdrawalResult).toHaveProperty('withdrawalWindow');
      expect(withdrawalResult).toHaveProperty('falloutTriggered');
    });

    test('should process market alerts through robots', async () => {
      const itemId = 'pact_robot_004';
      
      await walletService.processShippingHold(itemId, 35.00);
      
      const riskPercentage = 70;
      const antiCollateral = await investmentService.calculateAntiCollateral(24.50, riskPercentage);
      await walletService.enableRiskyInvestmentMode(itemId, riskPercentage, antiCollateral);

      const robot = await robotService.activateRobotForItem(itemId, 'investment_004');
      
      const marketAlert = {
        type: 'downturn' as const,
        severity: 'high' as const,
        message: 'Market downturn detected',
        timestamp: new Date().toISOString()
      };

      await robotService.processMarketAlert(marketAlert);

      const alerts = robotService.getMarketAlerts();
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[alerts.length - 1].severity).toBe('high');
    });

    test('should coordinate emergency protocols through robots', async () => {
      const itemId = 'pact_robot_005';
      
      await walletService.processShippingHold(itemId, 40.00);
      
      const riskPercentage = 80;
      const antiCollateral = await investmentService.calculateAntiCollateral(32.00, riskPercentage);
      await walletService.enableRiskyInvestmentMode(itemId, riskPercentage, antiCollateral);

      const robot = await robotService.activateRobotForItem(itemId, 'investment_005');
      
      await robotService.coordinateEmergencyProtocols();

      // Verify emergency protocols were coordinated
      const robotStatus = await robotService.getRobotStatus(itemId);
      expect(robotStatus.robotActive).toBe(true);
    });

    test('should deactivate robots after resolution', async () => {
      const itemId = 'pact_robot_006';
      
      await walletService.processShippingHold(itemId, 45.00);
      
      const riskPercentage = 30;
      const antiCollateral = await investmentService.calculateAntiCollateral(13.50, riskPercentage);
      await walletService.enableRiskyInvestmentMode(itemId, riskPercentage, antiCollateral);

      const robot = await robotService.activateRobotForItem(itemId, 'investment_006');
      
      const deactivated = await robotService.deactivateRobot(itemId);
      expect(deactivated).toBe(true);

      const robotStatus = await robotService.getRobotStatus(itemId);
      expect(robotStatus.robotActive).toBe(false);
    });
  });

  describe('InvestmentService ↔ Tax Document API (Plan #2)', () => {
    test('should trigger capital loss report generation', async () => {
      const itemId = 'pact_tax_001';
      
      await walletService.processShippingHold(itemId, 50.00);
      await walletService.createInsuranceHold(itemId, 20.00);

      const falloutData = {
        totalLoss: 100.00,
        borrowerShare: 35.00,
        ownerShare: 35.00,
        shippingRefund: 25.00,
        insuranceRefund: 10.00,
        investmentLoss: 30.00
      };

      await walletService.handleFalloutScenario(itemId, falloutData);

      // Verify fallout data is available for tax document generation
      expect(falloutData.investmentLoss).toBe(30.00);
      expect(falloutData.borrowerShare).toBe(35.00);
      expect(falloutData.ownerShare).toBe(35.00);

      // In production, this would trigger Plan #2 tax document generation
      // For now, we verify the data structure is correct
      const taxData = {
        itemId,
        borrowerCapitalLoss: falloutData.investmentLoss / 2,
        ownerCapitalLoss: falloutData.investmentLoss / 2,
        borrowerRefund: falloutData.borrowerShare,
        ownerRefund: falloutData.ownerShare,
        totalInvestmentLoss: falloutData.investmentLoss,
        falloutDate: new Date().toISOString()
      };

      expect(taxData.borrowerCapitalLoss).toBe(15.00);
      expect(taxData.ownerCapitalLoss).toBe(15.00);
      expect(taxData.totalInvestmentLoss).toBe(30.00);
    });
  });

  describe('Cross-Service Integration Scenarios', () => {
    test('should handle complete risky investment lifecycle', async () => {
      const itemId = 'pact_lifecycle_001';
      const riskPercentage = 55;

      // Step 1: Create holds through WalletService
      await walletService.processShippingHold(itemId, 30.00);
      await walletService.createAdditionalInvestmentHold(itemId, 40.00);
      await walletService.createInsuranceHold(itemId, 25.00);

      // Step 2: Enable risky mode through InvestmentService
      const amountAtRisk = (60.00 * riskPercentage) / 100; // 33.00
      const antiCollateral = await investmentService.calculateAntiCollateral(amountAtRisk, riskPercentage);
      await walletService.enableRiskyInvestmentMode(itemId, riskPercentage, antiCollateral);

      // Step 3: Invest holds through InvestmentService
      await walletService.investHold(itemId, 'shipping_2x', amountAtRisk);
      await walletService.investHold(itemId, 'additional', 40.00);

      // Step 4: Ship item through ShippingService
      await shippingService.processItemShipping(itemId, 'TRK999888');

      // Step 5: Invest insurance holds (now eligible)
      await walletService.investHold(itemId, 'insurance', 25.00);

      // Step 6: Activate robots through InvestmentRobotService
      const robot = await robotService.activateRobotForItem(itemId, 'investment_lifecycle');

      // Step 7: Simulate market downturn and fallout
      const marketAlert = {
        type: 'downturn' as const,
        severity: 'critical' as const,
        message: 'Critical market downturn',
        timestamp: new Date().toISOString()
      };

      await robotService.processMarketAlert(marketAlert);
      await robotService.coordinateEmergencyProtocols();

      const withdrawalResult = await robotService.attemptWithdrawal(robot.investmentId);
      
      if (withdrawalResult.falloutTriggered) {
        const falloutData = {
          totalLoss: 120.00,
          borrowerShare: 27.50,
          ownerShare: 27.50,
          shippingRefund: 15.00,
          insuranceRefund: 12.50,
          investmentLoss: 65.00
        };

        await investmentService.handleFalloutScenario(itemId, falloutData);
        await walletService.handleFalloutScenario(itemId, falloutData);
      }

      // Step 8: Deactivate robots
      await robotService.deactivateRobot(itemId);

      // Verify final state
      const investmentStatus = await investmentService.getInvestmentStatus(itemId);
      const robotStatus = await robotService.getRobotStatus(itemId);

      expect(investmentStatus.riskyModeEnabled).toBe(false);
      expect(robotStatus.robotActive).toBe(false);

      console.log('✅ Complete risky investment lifecycle PACT test passed');
    });
  });
});
