/**
 * PACT Tests for Document Generation API Provider
 */

import { DocumentController } from '../../../backend/src/main/kotlin/com/inventory/api/controller/DocumentController';

describe('Document Generation PACT Tests', () => {
  let documentController: DocumentController;

  beforeEach(() => {
    documentController = new DocumentController();
  });

  test('should generate inventory report with prices', async () => {
    const response = await documentController.generateInventoryReport({
      userId: 'user_001',
      includePrices: true,
      organizedBySize: true
    });

    expect(response.documentType).toBe('inventory_report');
    expect(response.jobId).toBeTruthy();
  });

  test('should generate sales report without PII', async () => {
    const response = await documentController.generateSalesReport({
      userId: 'user_001',
      includePII: false,
      startDate: '2024-01-01',
      endDate: '2024-12-31'
    });

    expect(response.piiExcluded).toBe(true);
    expect(response.documentType).toBe('sales_report');
  });

  test('should generate legal documents', async () => {
    const termsResponse = await documentController.generateLegalDocument({
      documentType: 'terms_of_service',
      version: '2.0',
      effectiveDate: '2024-01-15'
    });

    expect(termsResponse.documentType).toBe('terms_of_service');
    expect(termsResponse.jobId).toBeTruthy();
  });
});

