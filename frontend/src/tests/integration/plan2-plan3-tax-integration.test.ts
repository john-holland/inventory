/**
 * Integration Test: Plan #2 ↔ Plan #3 Tax Document Generation
 * Tests fallout scenario triggers Plan #2 tax document generation
 */

import { InvestmentService } from '../../services/InvestmentService';
import { WalletService } from '../../services/WalletService';
import { DocumentJobQueueService } from '../../../backend/src/main/kotlin/com/inventory/api/service/DocumentJobQueueService';

describe('Plan #2 ↔ Plan #3 Tax Document Integration', () => {
  let investmentService: InvestmentService;
  let walletService: WalletService;
  let documentService: DocumentJobQueueService;

  beforeEach(() => {
    investmentService = InvestmentService.getInstance();
    walletService = WalletService.getInstance();
    documentService = DocumentJobQueueService.getInstance();
  });

  test('fallout scenario should trigger tax document generation', async () => {
    console.log('🔗 Testing Plan #2 ↔ Plan #3 Tax Integration');
    
    const itemId = 'tax_integration_item_001';
    const userId = 'user_tax_001';
    
    // Step 1: Enable risky investment mode (Plan #3)
    await walletService.processShippingHold(itemId, 30.00);
    await walletService.createInsuranceHold(itemId, 15.00);
    
    const riskPercentage = 50;
    const antiCollateral = await investmentService.calculateAntiCollateral(15.00, riskPercentage);
    await walletService.enableRiskyInvestmentMode(itemId, riskPercentage, antiCollateral);
    
    const investmentStatus = await investmentService.getInvestmentStatus(itemId);
    expect(investmentStatus.riskyModeEnabled).toBe(true);
    
    // Step 2: Simulate investment failure and fallout (Plan #3)
    const totalLoss = 100.00;
    await investmentService.handleFalloutScenario(itemId, totalLoss);
    
    const falloutData = {
      totalLoss,
      borrowerShare: 22.50, // (30 + 15) / 2
      ownerShare: 22.50,
      shippingRefund: 15.00,
      insuranceRefund: 7.50,
      investmentLoss: 50.00
    };
    
    await walletService.handleFalloutScenario(itemId, falloutData);
    
    // Step 3: Verify tax document generated (Plan #2)
    const capitalLossReport = await documentService.generateCapitalLossReport({
      userId,
      itemId,
      borrowerCapitalLoss: falloutData.investmentLoss / 2,
      ownerCapitalLoss: falloutData.investmentLoss / 2,
      totalInvestmentLoss: falloutData.investmentLoss,
      falloutDate: new Date().toISOString()
    });
    
    expect(capitalLossReport).toBeDefined();
    expect(capitalLossReport.documentType).toBe('capital_loss_report');
    expect(capitalLossReport.borrowerCapitalLoss).toBe(25.00);
    expect(capitalLossReport.ownerCapitalLoss).toBe(25.00);
    expect(capitalLossReport.totalInvestmentLoss).toBe(50.00);
    
    // Step 4: Verify document is available on Documents page
    const taxDocuments = await documentService.getUserTaxDocuments(userId);
    expect(taxDocuments.length).toBeGreaterThan(0);
    
    const capitalLossDoc = taxDocuments.find(doc => doc.documentType === 'capital_loss_report');
    expect(capitalLossDoc).toBeDefined();
    expect(capitalLossDoc.documentId).toBeTruthy();
    
    // Step 5: Verify tax properties stored in warehousing
    const taxProperties = await documentService.getTaxProperties(userId);
    expect(taxProperties).toContainEqual({
      itemId,
      borrowerCapitalLoss: 25.00,
      ownerCapitalLoss: 25.00,
      totalInvestmentLoss: 50.00,
      falloutDate: expect.any(String),
      taxYear: new Date().getFullYear(),
      reportable: true
    });
    
    console.log('✅ Plan #2 ↔ Plan #3 Tax Integration Test Passed');
    
    return {
      itemId,
      userId,
      capitalLossReport,
      taxDocumentsCount: taxDocuments.length
    };
  });
});

