/**
 * PACT Contract: Tax Document API Provider
 * Defines contracts for tax document generation service
 */

const { Pact } = require('@pact-foundation/pact');
const path = require('path');

describe('Tax Document API PACT Contract', () => {
  const provider = new Pact({
    consumer: 'Frontend',
    provider: 'Tax Document API',
    port: 1234,
    log: path.resolve(process.cwd(), 'logs', 'tax_document_pact.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2
  });

  beforeAll(() => provider.setup());
  afterEach(() => provider.verify());
  afterAll(() => provider.finalize());

  describe('W2 Document Generation', () => {
    test('should generate W2 document', async () => {
      await provider
        .given('user has employment data for 2024')
        .uponReceiving('a request to generate W2 document')
        .withRequest({
          method: 'POST',
          path: '/api/tax/generate-w2',
          headers: { 'Content-Type': 'application/json' },
          body: {
            userId: 'user_001',
            year: 2024,
            wages: 75000.00,
            federalWithheld: 12000.00,
            stateWithheld: 4500.00
          }
        })
        .willRespondWith({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            jobId: 'job_123456',
            documentType: 'w2',
            status: 'processing',
            estimatedCompletion: '2024-01-15T10:05:00Z'
          }
        });
    });
  });

  describe('1099-C Document Generation', () => {
    test('should generate 1099-C document', async () => {
      await provider
        .given('debt cancellation occurred')
        .uponReceiving('a request to generate 1099-C document')
        .withRequest({
          method: 'POST',
          path: '/api/tax/generate-1099c',
          headers: { 'Content-Type': 'application/json' },
          body: {
            creditorName: 'Bank ABC',
            debtorName: 'John Doe',
            debtAmount: 5000.00,
            cancellationDate: '2024-01-01'
          }
        })
        .willRespondWith({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            jobId: 'job_789012',
            documentType: '1099c',
            status: 'processing',
            estimatedCompletion: '2024-01-15T10:05:00Z'
          }
        });
    });
  });

  describe('Capital Loss Report Generation', () => {
    test('should generate capital loss report', async () => {
      await provider
        .given('investment fallout scenario occurred')
        .uponReceiving('a request to generate capital loss report')
        .withRequest({
          method: 'POST',
          path: '/api/tax/generate-capital-loss',
          headers: { 'Content-Type': 'application/json' },
          body: {
            userId: 'user_001',
            itemId: 'item_001',
            borrowerCapitalLoss: 25.00,
            ownerCapitalLoss: 25.00,
            totalInvestmentLoss: 50.00,
            falloutDate: '2024-01-15T10:00:00Z'
          }
        })
        .willRespondWith({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            jobId: 'job_345678',
            documentType: 'capital_loss_report',
            status: 'processing',
            estimatedCompletion: '2024-01-15T10:05:00Z',
            borrowerCapitalLoss: 25.00,
            ownerCapitalLoss: 25.00
          }
        });
    });
  });

  describe('Document Status Check', () => {
    test('should return document generation status', async () => {
      await provider
        .given('document generation job is in progress')
        .uponReceiving('a request for document status')
        .withRequest({
          method: 'GET',
          path: '/api/tax/document-status/job_123456',
          headers: { 'Accept': 'application/json' }
        })
        .willRespondWith({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            jobId: 'job_123456',
            status: 'completed',
            documentId: 'doc_123456',
            downloadUrl: '/api/tax/download/doc_123456',
            completedAt: '2024-01-15T10:05:00Z'
          }
        });
    });
  });

  describe('Document Download', () => {
    test('should download completed document', async () => {
      await provider
        .given('document generation is completed')
        .uponReceiving('a request to download document')
        .withRequest({
          method: 'GET',
          path: '/api/tax/download/doc_123456',
          headers: { 'Accept': 'application/pdf' }
        })
        .willRespondWith({
          status: 200,
          headers: { 'Content-Type': 'application/pdf' },
          body: 'PDF_BINARY_CONTENT'
        });
    });
  });
});

