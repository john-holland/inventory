/**
 * PACT Tests for Tax Document API Provider
 * Tests contracts between Frontend and Tax Document API
 */

import { DocumentController } from '../../../backend/src/main/kotlin/com/inventory/api/controller/DocumentController';
import { DocumentJobQueueService } from '../../../backend/src/main/kotlin/com/inventory/api/service/DocumentJobQueueService';

describe('Tax Document API PACT Tests', () => {
  let documentController: DocumentController;
  let jobQueueService: DocumentJobQueueService;

  beforeEach(() => {
    documentController = new DocumentController();
    jobQueueService = DocumentJobQueueService.getInstance();
  });

  test('should generate W2 document through API', async () => {
    const w2Request = {
      userId: 'user_001',
      year: 2024,
      wages: 75000.00,
      federalWithheld: 12000.00,
      stateWithheld: 4500.00
    };

    const response = await documentController.generateTaxDocument('w2', w2Request);
    expect(response.documentType).toBe('w2');
    expect(response.jobId).toBeTruthy();
  });

  test('should generate 1099-C document', async () => {
    const request1099 = {
      creditorName: 'Bank ABC',
      debtorName: 'John Doe',
      debtAmount: 5000.00,
      cancellationDate: '2024-01-01'
    };

    const response = await documentController.generateTaxDocument('1099c', request1099);
    expect(response.documentType).toBe('1099c');
    expect(response.jobId).toBeTruthy();
  });

  test('should generate capital loss report', async () => {
    const capitalLossRequest = {
      userId: 'user_001',
      itemId: 'item_001',
      borrowerCapitalLoss: 25.00,
      ownerCapitalLoss: 25.00,
      totalInvestmentLoss: 50.00,
      falloutDate: '2024-01-15T10:00:00Z'
    };

    const response = await documentController.generateCapitalLossReport(capitalLossRequest);
    expect(response.documentType).toBe('capital_loss_report');
    expect(response.borrowerCapitalLoss).toBe(25.00);
    expect(response.ownerCapitalLoss).toBe(25.00);
  });

  test('should check document generation status', async () => {
    const status = await jobQueueService.getJobStatus('job_123456');
    expect(status).toBeDefined();
    expect(status.jobId).toBe('job_123456');
  });

  test('should download completed document', async () => {
    const document = await documentController.downloadDocument('doc_123456');
    expect(document).toBeTruthy();
    expect(document.documentId).toBe('doc_123456');
  });
});

