/**
 * PACT Contract: Document Generation API Provider
 * Defines contracts for inventory reports, sales reports, and legal documents
 */

const { Pact } = require('@pact-foundation/pact');
const path = require('path');

describe('Document Generation API PACT Contract', () => {
  const provider = new Pact({
    consumer: 'Frontend',
    provider: 'Document Generation API',
    port: 1236,
    log: path.resolve(process.cwd(), 'logs', 'document_generation_pact.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2
  });

  beforeAll(() => provider.setup());
  afterEach(() => provider.verify());
  afterAll(() => provider.finalize());

  describe('Inventory Report Generation', () => {
    test('should generate inventory report with prices', async () => {
      await provider
        .given('user has inventory items')
        .uponReceiving('a request to generate inventory report with prices')
        .withRequest({
          method: 'POST',
          path: '/api/documents/inventory-report',
          headers: { 'Content-Type': 'application/json' },
          body: {
            userId: 'user_001',
            includePrices: true,
            organizedBySize: true,
            format: 'pdf'
          }
        })
        .willRespondWith({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            jobId: 'job_inv_001',
            documentType: 'inventory_report',
            status: 'processing'
          }
        });
    });
  });

  describe('Sales Report Generation', () => {
    test('should generate sales report without PII', async () => {
      await provider
        .given('user has sales data')
        .uponReceiving('a request to generate sales report without PII')
        .withRequest({
          method: 'POST',
          path: '/api/documents/sales-report',
          headers: { 'Content-Type': 'application/json' },
          body: {
            userId: 'user_001',
            includePII: false,
            startDate: '2024-01-01',
            endDate: '2024-12-31'
          }
        })
        .willRespondWith({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            jobId: 'job_sales_001',
            documentType: 'sales_report',
            status: 'processing',
            piiExcluded: true
          }
        });
    });
  });

  describe('Legal Document Generation', () => {
    test('should generate Terms of Service', async () => {
      await provider
        .given('user needs Terms of Service document')
        .uponReceiving('a request to generate Terms of Service')
        .withRequest({
          method: 'POST',
          path: '/api/documents/legal-document',
          headers: { 'Content-Type': 'application/json' },
          body: {
            documentType: 'terms_of_service',
            version: '2.0',
            effectiveDate: '2024-01-15'
          }
        })
        .willRespondWith({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            jobId: 'job_legal_001',
            documentType: 'terms_of_service',
            status: 'processing'
          }
        });
    });
  });
});

