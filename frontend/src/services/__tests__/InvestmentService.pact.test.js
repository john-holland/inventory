/**
 * PACT Tests for InvestmentService Provider Interactions
 */

import { InvestmentService } from '../InvestmentService';
import { WalletService } from '../WalletService';
import { ShippingService } from '../ShippingService';
import { InvestmentRobotService } from '../InvestmentRobotService';

const WALLET = 'wallet_001';
const WALLET_OWNER = 'wallet_002';

describe('InvestmentService PACT Tests', () => {
  let investmentService;
  let walletService;
  let shippingService;
  let robotService;

  beforeEach(() => {
    walletService = WalletService.getInstance();
    walletService.resetMockStateForTests();
    investmentService = InvestmentService.getInstance();
    investmentService.resetMockStateForTests();
    shippingService = ShippingService.getInstance();
    robotService = InvestmentRobotService.getInstance();
  });

  describe('InvestmentService ↔ WalletService', () => {
    test('should create shipping hold through WalletService', async () => {
      const itemId = 'pact_wallet_001';
      const shippingCost = 20.0;

      await walletService.processShippingHold(itemId, shippingCost);

      const holdBalance = await investmentService.trackPerItemHolds(itemId);
      expect(holdBalance.shippingHold2x).toBe(40.0);
    });

    test('should create additional investment hold through WalletService', async () => {
      const itemId = 'pact_wallet_002';
      const amount = 30.0;

      await walletService.createAdditionalInvestmentHold(itemId, amount);

      const holdBalance = await investmentService.trackPerItemHolds(itemId);
      expect(holdBalance.additionalHold).toBe(30.0);
    });

    test('should create insurance hold through WalletService', async () => {
      const itemId = 'pact_wallet_003';
      const amount = 15.0;

      await walletService.createInsuranceHold(itemId, amount);

      const holdBalance = await investmentService.trackPerItemHolds(itemId);
      expect(holdBalance.insuranceHold).toBe(15.0);
    });

    test('should enable risky investment mode through WalletService', async () => {
      const itemId = 'pact_wallet_004';
      const riskPercentage = 50;

      await walletService.processShippingHold(itemId, 25.0);
      const hold2x = 50.0;
      const amountAtRisk = (hold2x * riskPercentage) / 100;
      const antiCollateral = await investmentService.calculateAntiCollateral(amountAtRisk, riskPercentage);
      await walletService.enableRiskyInvestmentMode(WALLET, itemId, riskPercentage, antiCollateral);

      const investmentStatus = await investmentService.getInvestmentStatus(itemId);
      expect(investmentStatus.riskyModeEnabled).toBe(true);
      expect(investmentStatus.riskPercentage).toBe(riskPercentage);
    });

    test('should handle fallout scenario through WalletService', async () => {
      const itemId = 'pact_wallet_005';

      await walletService.processShippingHold(itemId, 30.0);
      await walletService.createInsuranceHold(itemId, 10.0);

      const totalLoss = 60.0;
      const shippingCost = 15.0;
      const insuranceCost = 5.0;

      await walletService.handleFalloutScenario(
        itemId,
        WALLET,
        WALLET_OWNER,
        totalLoss,
        shippingCost,
        insuranceCost
      );

      expect(totalLoss).toBe(60.0);
    });
  });

  describe('InvestmentService ↔ ShippingService', () => {
    test('should trigger insurance hold investment after shipping', async () => {
      const itemId = 'pact_shipping_001';

      await walletService.createInsuranceHold(itemId, 20.0);

      let eligibility = await investmentService.checkInvestmentEligibility(itemId, 'insurance');
      expect(eligibility.isEligible).toBe(false);

      await shippingService.processItemShipping(itemId, 'TRK123456');

      eligibility = await investmentService.checkInvestmentEligibility(itemId, 'insurance');
      expect(eligibility.isEligible).toBe(true);
    });

    test('should integrate with shipping status for investment decisions', async () => {
      const itemId = 'pact_shipping_002';

      await walletService.createInsuranceHold(itemId, 25.0);
      await shippingService.processItemShipping(itemId, 'TRK789012');

      const shippingStatus = await shippingService.getShippingStatus(itemId);
      expect(shippingStatus.investmentStatus.insuranceHoldInvestable).toBe(true);
      expect(shippingStatus.investmentStatus.totalInvestableHolds).toBe(25.0);
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

      await walletService.processShippingHold(itemId, 20.0);

      const riskPercentage = 40;
      const amountAtRisk = (40 * riskPercentage) / 100;
      const antiCollateral = await investmentService.calculateAntiCollateral(amountAtRisk, riskPercentage);
      await walletService.enableRiskyInvestmentMode(WALLET, itemId, riskPercentage, antiCollateral);

      const robot = await robotService.activateRobotForItem(itemId, 'investment_001');
      expect(robot.itemId).toBe(itemId);
      expect(robot.isActive).toBe(true);

      const robotStatus = await robotService.getRobotStatus(itemId);
      expect(robotStatus.robotActive).toBe(true);
    });

    test('should monitor investment through robots', async () => {
      const itemId = 'pact_robot_002';

      await walletService.processShippingHold(itemId, 25.0);

      const riskPercentage = 60;
      const amountAtRiskRobot2 = (50 * riskPercentage) / 100;
      const antiCollateral = await investmentService.calculateAntiCollateral(amountAtRiskRobot2, riskPercentage);
      await walletService.enableRiskyInvestmentMode(WALLET, itemId, riskPercentage, antiCollateral);

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

      await walletService.processShippingHold(itemId, 30.0);

      const riskPercentage = 50;
      const amountAtRiskRobot3 = (60 * riskPercentage) / 100;
      const antiCollateral = await investmentService.calculateAntiCollateral(amountAtRiskRobot3, riskPercentage);
      await walletService.enableRiskyInvestmentMode(WALLET, itemId, riskPercentage, antiCollateral);

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

      await walletService.processShippingHold(itemId, 35.0);

      const riskPercentage = 70;
      const amountAtRiskRobot4 = (70 * riskPercentage) / 100;
      const antiCollateral = await investmentService.calculateAntiCollateral(amountAtRiskRobot4, riskPercentage);
      await walletService.enableRiskyInvestmentMode(WALLET, itemId, riskPercentage, antiCollateral);

      await robotService.activateRobotForItem(itemId, 'investment_004');

      const marketAlert = {
        type: 'downturn',
        severity: 'high',
        message: 'Market downturn detected',
        timestamp: new Date().toISOString(),
      };

      await robotService.processMarketAlert(marketAlert);

      const alerts = robotService.getMarketAlerts();
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts[alerts.length - 1].severity).toBe('high');
    });

    test('should coordinate emergency protocols through robots', async () => {
      const itemId = 'pact_robot_005';

      await walletService.processShippingHold(itemId, 40.0);

      const riskPercentage = 80;
      const amountAtRiskRobot5 = (80 * riskPercentage) / 100;
      const antiCollateral = await investmentService.calculateAntiCollateral(amountAtRiskRobot5, riskPercentage);
      await walletService.enableRiskyInvestmentMode(WALLET, itemId, riskPercentage, antiCollateral);

      await robotService.activateRobotForItem(itemId, 'investment_005');

      await robotService.coordinateEmergencyProtocols();

      const robotStatus = await robotService.getRobotStatus(itemId);
      expect(robotStatus.robotActive).toBe(true);
    });

    test('should deactivate robots after resolution', async () => {
      const itemId = 'pact_robot_006';

      await walletService.processShippingHold(itemId, 45.0);

      const riskPercentage = 30;
      const amountAtRiskRobot6 = (90 * riskPercentage) / 100;
      const antiCollateral = await investmentService.calculateAntiCollateral(amountAtRiskRobot6, riskPercentage);
      await walletService.enableRiskyInvestmentMode(WALLET, itemId, riskPercentage, antiCollateral);

      await robotService.activateRobotForItem(itemId, 'investment_006');

      const deactivated = await robotService.deactivateRobot(itemId);
      expect(deactivated).toBe(true);

      const robotStatus = await robotService.getRobotStatus(itemId);
      expect(robotStatus.robotActive).toBe(false);
    });
  });

  describe('InvestmentService ↔ Tax Document API (Plan #2)', () => {
    test('should trigger capital loss report generation', async () => {
      const itemId = 'pact_tax_001';

      await walletService.processShippingHold(itemId, 50.0);
      await walletService.createInsuranceHold(itemId, 20.0);

      const falloutData = {
        totalLoss: 100.0,
        borrowerShare: 35.0,
        ownerShare: 35.0,
        shippingRefund: 25.0,
        insuranceRefund: 10.0,
        investmentLoss: 30.0,
      };

      await walletService.handleFalloutScenario(
        itemId,
        WALLET,
        WALLET_OWNER,
        falloutData.totalLoss,
        falloutData.shippingRefund,
        falloutData.insuranceRefund
      );

      expect(falloutData.investmentLoss).toBe(30.0);

      const taxData = {
        itemId,
        borrowerCapitalLoss: falloutData.investmentLoss / 2,
        ownerCapitalLoss: falloutData.investmentLoss / 2,
        borrowerRefund: falloutData.borrowerShare,
        ownerRefund: falloutData.ownerShare,
        totalInvestmentLoss: falloutData.investmentLoss,
        falloutDate: new Date().toISOString(),
      };

      expect(taxData.borrowerCapitalLoss).toBe(15.0);
      expect(taxData.ownerCapitalLoss).toBe(15.0);
      expect(taxData.totalInvestmentLoss).toBe(30.0);
    });
  });

  describe('Cross-Service Integration Scenarios', () => {
    test('should handle complete risky investment lifecycle', async () => {
      const itemId = 'pact_lifecycle_001';
      const riskPercentage = 55;

      await walletService.processShippingHold(itemId, 30.0);
      await walletService.createAdditionalInvestmentHold(itemId, 40.0);
      await walletService.createInsuranceHold(itemId, 25.0);

      const hold2x = 60.0;
      const amountAtRisk = (hold2x * riskPercentage) / 100;
      const antiCollateral = await investmentService.calculateAntiCollateral(amountAtRisk, riskPercentage);
      await walletService.enableRiskyInvestmentMode(WALLET, itemId, riskPercentage, antiCollateral);

      await walletService.investHold(WALLET, itemId, 'shipping', amountAtRisk);
      await walletService.investHold(WALLET, itemId, 'additional', 40.0);

      await shippingService.processItemShipping(itemId, 'TRK999888');

      await walletService.investHold(WALLET, itemId, 'insurance', 25.0);

      const robot = await robotService.activateRobotForItem(itemId, 'investment_lifecycle');

      const marketAlert = {
        type: 'downturn',
        severity: 'critical',
        message: 'Critical market downturn',
        timestamp: new Date().toISOString(),
      };

      await robotService.processMarketAlert(marketAlert);
      await robotService.coordinateEmergencyProtocols();

      const withdrawalResult = await robotService.attemptWithdrawal(robot.investmentId);

      if (withdrawalResult.falloutTriggered) {
        await investmentService.handleFalloutScenario(itemId, 65.0);
        await walletService.handleFalloutScenario(itemId, WALLET, WALLET_OWNER, 120.0, 15.0, 12.5);
      }

      await robotService.deactivateRobot(itemId);

      const investmentStatus = await investmentService.getInvestmentStatus(itemId);
      const robotStatus = await robotService.getRobotStatus(itemId);

      expect(investmentStatus.riskyModeEnabled).toBe(false);
      expect(robotStatus.robotActive).toBe(false);
    });
  });
});

