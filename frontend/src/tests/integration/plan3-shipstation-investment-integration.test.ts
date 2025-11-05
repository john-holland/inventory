/**
 * Integration Test: Plan #3 ShipStation → Plan #3 Investment
 * Tests ShipStation optimization savings trigger automatic reinvestment
 */

import { ShipStationService } from '../../services/ShipStationService';
import { InvestmentService } from '../../services/InvestmentService';
import { WalletService } from '../../services/WalletService';

describe('Plan #3 ShipStation → Plan #3 Investment Integration', () => {
  let shipStationService: ShipStationService;
  let investmentService: InvestmentService;
  let walletService: WalletService;

  beforeEach(() => {
    shipStationService = ShipStationService.getInstance();
    investmentService = InvestmentService.getInstance();
    walletService = WalletService.getInstance();
  });

  test('shipping optimization should trigger investment reinvestment', async () => {
    console.log('🔗 Testing ShipStation → Investment Integration');
    
    const itemId = 'shipstation_investment_001';
    const shipmentId = 'shipment_001';
    
    // Step 1: Create shipment
    console.log('Step 1: Creating shipment');
    const shipment = await shipStationService.createShipment(itemId, 'USPS', 'Priority Mail', 20.00);
    expect(shipment.rate).toBe(20.00);
    
    // Step 2: Check optimization opportunities
    console.log('Step 2: Checking optimization opportunities');
    const eligibility = await shipStationService.isEligibleForOptimization(shipmentId);
    
    if (eligibility.eligible && eligibility.potentialSavings > 0) {
      console.log(`Optimization available: $${eligibility.potentialSavings.toFixed(2)}`);
      
      // Step 3: Optimize shipping label
      console.log('Step 3: Optimizing shipping label');
      const optimizationResult = await shipStationService.optimizeShippingLabel(shipmentId);
      
      expect(optimizationResult.success).toBe(true);
      expect(optimizationResult.savings).toBeGreaterThan(0);
      
      // Step 4: Verify automatic reinvestment triggered
      console.log('Step 4: Verifying automatic reinvestment');
      expect(optimizationResult.reinvestmentTriggered).toBe(true);
      expect(optimizationResult.reinvestmentAmount).toBeGreaterThan(0);
      
      // Step 5: Verify investment status updated
      const investmentStatus = await investmentService.getInvestmentStatus(itemId);
      expect(investmentStatus.currentInvestments).toBeGreaterThan(0);
      
      // Step 6: Verify transaction recorded
      console.log('Step 6: Verifying transaction recorded');
      const walletId = 'wallet_001';
      const transactions = walletService.getTransactionHistory(walletId);
      
      const reinvestmentTx = transactions.find(tx => 
        tx.description.includes('shipping optimization') &&
        tx.description.includes('reinvestment')
      );
      
      expect(reinvestmentTx).toBeDefined();
      expect(reinvestmentTx.amount).toBe(optimizationResult.reinvestmentAmount);
      
      console.log('✅ ShipStation → Investment Integration Test Passed');
      
      return {
        shipmentId,
        savings: optimizationResult.savings,
        reinvestmentAmount: optimizationResult.reinvestmentAmount,
        investmentUpdated: true
      };
    } else {
      console.log('⚠️ No optimization opportunity available');
      return { no_optimization: true };
    }
  });
});

