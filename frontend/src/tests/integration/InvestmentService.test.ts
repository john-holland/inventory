/**
 * Integration Tests for InvestmentService
 * Tests hold tracking, eligibility checks, risky mode, and anti-collateral calculation
 */

import { InvestmentService } from '../services/InvestmentService';
import { WalletService } from '../services/WalletService';
import { ShippingService } from '../services/ShippingService';

describe('InvestmentService Integration Tests', () => {
  let investmentService: InvestmentService;
  let walletService: WalletService;
  let shippingService: ShippingService;

  beforeEach(() => {
    investmentService = InvestmentService.getInstance();
    walletService = WalletService.getInstance();
    shippingService = ShippingService.getInstance();
  });

  describe('Hold Tracking', () => {
    test('should track per-item holds correctly', async () => {
      const itemId = 'test_item_001';
      
      // Create holds
      await walletService.processShippingHold(itemId, 15.00);
      await walletService.createAdditionalInvestmentHold(itemId, 25.00);
      await walletService.createInsuranceHold(itemId, 10.00);

      const holdBalance = await investmentService.trackPerItemHolds(itemId);

      expect(holdBalance.itemId).toBe(itemId);
      expect(holdBalance.shippingHold2x).toBe(30.00); // 2x shipping
      expect(holdBalance.additionalHold).toBe(25.00);
      expect(holdBalance.insuranceHold).toBe(10.00);
      expect(holdBalance.totalInvestable).toBe(35.00); // additional + insurance
      expect(holdBalance.totalNonInvestable).toBe(30.00); // shipping 2x
    });

    test('should calculate total investable and non-investable correctly', async () => {
      const itemId = 'test_item_002';
      
      await walletService.processShippingHold(itemId, 20.00);
      await walletService.createAdditionalInvestmentHold(itemId, 30.00);
      await walletService.createInsuranceHold(itemId, 15.00);

      const holdBalance = await investmentService.trackPerItemHolds(itemId);

      expect(holdBalance.totalInvestable).toBe(45.00); // 30 + 15
      expect(holdBalance.totalNonInvestable).toBe(40.00); // 2x shipping
    });
  });

  describe('Investment Eligibility', () => {
    test('should correctly identify shipping hold eligibility', async () => {
      const itemId = 'test_item_003';
      
      await walletService.processShippingHold(itemId, 15.00);

      // Without risky mode - should not be eligible
      const eligibility = await investmentService.checkInvestmentEligibility(itemId, 'shipping_2x');
      
      expect(eligibility.isEligible).toBe(false);
      expect(eligibility.reason).toContain('reserved for round-trip shipping');
      expect(eligibility.requirements).toContain('Enable risky investment mode');
    });

    test('should correctly identify additional hold eligibility', async () => {
      const itemId = 'test_item_004';
      
      await walletService.createAdditionalInvestmentHold(itemId, 25.00);

      const eligibility = await investmentService.checkInvestmentEligibility(itemId, 'additional');
      
      expect(eligibility.isEligible).toBe(true);
      expect(eligibility.reason).toContain('immediately investable');
      expect(eligibility.requirements).toHaveLength(0);
    });

    test('should correctly identify insurance hold eligibility', async () => {
      const itemId = 'test_item_005';
      
      await walletService.createInsuranceHold(itemId, 10.00);

      // Before shipping - should not be eligible
      let eligibility = await investmentService.checkInvestmentEligibility(itemId, 'insurance');
      expect(eligibility.isEligible).toBe(false);
      expect(eligibility.reason).toContain('after item ships');

      // After shipping - should be eligible
      await shippingService.processItemShipping(itemId, 'TRK123456');
      eligibility = await investmentService.checkInvestmentEligibility(itemId, 'insurance');
      expect(eligibility.isEligible).toBe(true);
      expect(eligibility.reason).toContain('now investable');
    });
  });

  describe('Risky Investment Mode', () => {
    test('should enable risky investment mode with correct parameters', async () => {
      const itemId = 'test_item_006';
      const riskPercentage = 50;
      
      await walletService.processShippingHold(itemId, 20.00);
      
      const antiCollateral = await investmentService.calculateAntiCollateral(20.00, riskPercentage);
      
      await walletService.enableRiskyInvestmentMode(itemId, riskPercentage, antiCollateral);

      const investmentStatus = await investmentService.getInvestmentStatus(itemId);
      
      expect(investmentStatus.riskyModeEnabled).toBe(true);
      expect(investmentStatus.riskPercentage).toBe(riskPercentage);
      expect(investmentStatus.antiCollateralDeposited).toBe(antiCollateral);
    });

    test('should validate anti-collateral requirement', async () => {
      const itemId = 'test_item_007';
      const riskPercentage = 75;
      
      await walletService.processShippingHold(itemId, 20.00);
      
      const correctAntiCollateral = await investmentService.calculateAntiCollateral(15.00, riskPercentage);
      const incorrectAntiCollateral = correctAntiCollateral + 5.00; // Too high

      await expect(
        investmentService.enableRiskyInvestmentMode(itemId, riskPercentage, incorrectAntiCollateral)
      ).rejects.toThrow('Anti-collateral must equal opposite of risk boundary error');
    });

    test('should allow shipping hold investment after risky mode enabled', async () => {
      const itemId = 'test_item_008';
      const riskPercentage = 60;
      
      await walletService.processShippingHold(itemId, 25.00);
      
      const antiCollateral = await investmentService.calculateAntiCollateral(15.00, riskPercentage);
      await walletService.enableRiskyInvestmentMode(itemId, riskPercentage, antiCollateral);

      const eligibility = await investmentService.checkInvestmentEligibility(itemId, 'shipping_2x');
      
      expect(eligibility.isEligible).toBe(true);
      expect(eligibility.reason).toContain('Risky investment mode enabled');
    });
  });

  describe('Anti-Collateral Calculation', () => {
    test('should calculate anti-collateral correctly', async () => {
      const investmentAmount = 100.00;
      const riskPercentage = 50;
      
      const antiCollateral = investmentService.calculateAntiCollateral(investmentAmount, riskPercentage);
      
      // Should be investment amount * risk boundary error
      const riskBoundaryError = await investmentService.getRiskBoundaryError();
      const expectedAntiCollateral = investmentAmount * riskBoundaryError;
      
      expect(antiCollateral).toBe(expectedAntiCollateral);
    });

    test('should handle different risk percentages', async () => {
      const investmentAmount = 200.00;
      
      const antiCollateral25 = investmentService.calculateAntiCollateral(investmentAmount, 25);
      const antiCollateral75 = investmentService.calculateAntiCollateral(investmentAmount, 75);
      
      // Higher risk percentage should require more anti-collateral
      expect(antiCollateral75).toBeGreaterThan(antiCollateral25);
    });
  });

  describe('Investment Status', () => {
    test('should return complete investment status', async () => {
      const itemId = 'test_item_009';
      
      await walletService.processShippingHold(itemId, 30.00);
      await walletService.createAdditionalInvestmentHold(itemId, 40.00);
      await walletService.createInsuranceHold(itemId, 20.00);

      const investmentStatus = await investmentService.getInvestmentStatus(itemId);

      expect(investmentStatus.itemId).toBe(itemId);
      expect(investmentStatus.holdBalance.shippingHold2x).toBe(60.00);
      expect(investmentStatus.holdBalance.additionalHold).toBe(40.00);
      expect(investmentStatus.holdBalance.insuranceHold).toBe(20.00);
      expect(investmentStatus.holdBalance.totalInvestable).toBe(60.00);
      expect(investmentStatus.holdBalance.totalNonInvestable).toBe(60.00);
      expect(investmentStatus.riskyModeEnabled).toBe(false);
      expect(investmentStatus.robotsActive).toBe(false);
    });

    test('should update status after risky mode enabled', async () => {
      const itemId = 'test_item_010';
      const riskPercentage = 40;
      
      await walletService.processShippingHold(itemId, 25.00);
      
      const antiCollateral = await investmentService.calculateAntiCollateral(10.00, riskPercentage);
      await walletService.enableRiskyInvestmentMode(itemId, riskPercentage, antiCollateral);

      const investmentStatus = await investmentService.getInvestmentStatus(itemId);

      expect(investmentStatus.riskyModeEnabled).toBe(true);
      expect(investmentStatus.riskPercentage).toBe(riskPercentage);
      expect(investmentStatus.antiCollateralDeposited).toBe(antiCollateral);
      expect(investmentStatus.robotsActive).toBe(true);
    });
  });

  describe('Fallout Scenario Handling', () => {
    test('should handle fallout scenario correctly', async () => {
      const itemId = 'test_item_011';
      const investmentLoss = 50.00;
      
      await walletService.processShippingHold(itemId, 20.00);
      await walletService.createInsuranceHold(itemId, 10.00);
      
      const riskPercentage = 50;
      const antiCollateral = await investmentService.calculateAntiCollateral(10.00, riskPercentage);
      await walletService.enableRiskyInvestmentMode(itemId, riskPercentage, antiCollateral);

      await investmentService.handleFalloutScenario(itemId, investmentLoss);

      // Verify risky mode is disabled after fallout
      const investmentStatus = await investmentService.getInvestmentStatus(itemId);
      expect(investmentStatus.riskyModeEnabled).toBe(false);
    });

    test('should calculate 50/50 split correctly', async () => {
      const itemId = 'test_item_012';
      const investmentLoss = 100.00;
      
      await walletService.processShippingHold(itemId, 30.00);
      await walletService.createInsuranceHold(itemId, 15.00);

      // Mock fallout data
      const falloutData = {
        totalLoss: investmentLoss,
        borrowerShare: 22.50, // (30 + 15) / 2
        ownerShare: 22.50,
        shippingRefund: 15.00, // 30 / 2
        insuranceRefund: 7.50, // 15 / 2
        investmentLoss: 55.00 // 100 - 45
      };

      await walletService.handleFalloutScenario(itemId, falloutData);

      // Verify fallout was processed
      expect(falloutData.borrowerShare).toBe(22.50);
      expect(falloutData.ownerShare).toBe(22.50);
    });
  });

  describe('Risk Boundary Error', () => {
    test('should return valid risk boundary error', async () => {
      const riskBoundaryError = await investmentService.getRiskBoundaryError();
      
      expect(riskBoundaryError).toBeGreaterThan(0);
      expect(riskBoundaryError).toBeLessThanOrEqual(0.25); // Max 25%
    });

    test('should be consistent across calls', async () => {
      const error1 = await investmentService.getRiskBoundaryError();
      const error2 = await investmentService.getRiskBoundaryError();
      
      expect(error1).toBe(error2);
    });
  });
});
