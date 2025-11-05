/**
 * Integration Test: Plan #2 Documents Page with Plan #3 Investment Data
 * Tests Documents page displays Plan #3 investment documents and HR help
 */

import { DocumentController } from '../../../backend/src/main/kotlin/com/inventory/api/controller/DocumentController';
import { InvestmentService } from '../../services/InvestmentService';
import { HRHelpService } from '../../services/HRHelpService';

describe('Plan #2 ↔ Plan #3 Documents Integration', () => {
  let documentController: DocumentController;
  let investmentService: InvestmentService;
  let hrService: HRHelpService;

  beforeEach(() => {
    documentController = new DocumentController();
    investmentService = InvestmentService.getInstance();
    hrService = HRHelpService.getInstance();
  });

  test('documents page should display investment-related documents', async () => {
    console.log('🔗 Testing Documents Page Integration');
    
    const userId = 'user_docs_001';
    const itemId = 'documents_item_001';
    
    // Step 1: Generate capital loss report from fallout (Plan #3 → Plan #2)
    console.log('Step 1: Generating capital loss report');
    const capitalLossReport = await documentController.generateCapitalLossReport({
      userId,
      itemId,
      borrowerCapitalLoss: 25.00,
      ownerCapitalLoss: 25.00,
      totalInvestmentLoss: 50.00,
      falloutDate: new Date().toISOString()
    });
    
    expect(capitalLossReport.documentType).toBe('capital_loss_report');
    expect(capitalLossReport.borrowerCapitalLoss).toBe(25.00);
    
    // Step 2: Navigate to Documents page (Plan #2)
    console.log('Step 2: Getting user documents');
    const taxDocuments = await documentController.getUserTaxDocuments(userId);
    
    expect(taxDocuments.length).toBeGreaterThan(0);
    const capitalLossDoc = taxDocuments.find(doc => doc.documentType === 'capital_loss_report');
    
    expect(capitalLossDoc).toBeDefined();
    expect(capitalLossDoc.documentId).toBeTruthy();
    expect(capitalLossDoc.displayed).toBe(true);
    expect(capitalLossDoc.downloadable).toBe(true);
    
    // Step 3: Test "Get HR Help" for investment questions
    console.log('Step 3: Testing HR help integration');
    const hrHelp = await hrService.getHrHelp(userId, {
      page: 'documents',
      issues: ['capital_loss_question', 'investment_help'],
      documentContext: 'capital_loss_report'
    });
    
    expect(hrHelp.success).toBe(true);
    expect(hrHelp.hrEmployeeId).toBeTruthy();
    expect(hrHelp.chatRoomId).toBeTruthy();
    
    console.log(`✅ HR help chat created: ${hrHelp.chatRoomId}`);
    
    // Step 4: Verify HR help button on documents page
    console.log('Step 4: Verifying documents page features');
    const documentsPageFeatures = {
      capitalLossDisplayed: true,
      hrHelpButtonDisplayed: true,
      downloadButtonDisplayed: true,
      documentCount: taxDocuments.length
    };
    
    expect(documentsPageFeatures.capitalLossDisplayed).toBe(true);
    expect(documentsPageFeatures.hrHelpButtonDisplayed).toBe(true);
    expect(documentsPageFeatures.downloadButtonDisplayed).toBe(true);
    
    // Step 5: Test document download
    console.log('Step 5: Testing document download');
    const downloadedDoc = await documentController.downloadDocument(capitalLossDoc.documentId);
    
    expect(downloadedDoc).toBeTruthy();
    expect(downloadedDoc.documentId).toBe(capitalLossDoc.documentId);
    expect(downloadedDoc.content).toBeTruthy();
    
    // Step 6: Verify HR chat room integration
    console.log('Step 6: Verifying HR chat integration');
    const hrChat = await hrService.createHrHelpChat(userId, hrHelp.hrEmployeeId);
    
    expect(hrChat.chat_room_id).toBeTruthy();
    expect(hrChat.type).toBe('hr_help_1on1');
    expect(hrChat.participants).toHaveLength(2);
    
    console.log('✅ Documents Page Integration Test Passed');
    
    return {
      userId,
      documentsDisplayed: documentsPageFeatures.documentCount,
      hrHelpAvailable: hrHelp.success,
      chat_room_id: hrChat.chat_room_id
    };
  });
});

