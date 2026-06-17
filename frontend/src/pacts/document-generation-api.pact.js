/** @jest-environment node */

const { Matchers } = require('@pact-foundation/pact');
const { postJson } = require('./pactHttp');
const { createPactHarness } = require('./pactTestHarness');

const harness = createPactHarness({
  consumer: 'Frontend',
  provider: 'Document Generation API',
  logName: 'document_generation_pact',
});

describe('Document Generation API PACT Contract', () => {
  beforeAll(() => harness.resetPactFile());
  beforeEach(async () => harness.setup());
  afterEach(async () => harness.verify());
  afterAll(async () => harness.finalize());

  test('should generate inventory report with prices', async () => {
    await harness.provider.addInteraction({
      state: 'user has inventory items',
      uponReceiving: 'a request to generate inventory report with prices',
      withRequest: {
        method: 'POST',
        path: '/api/documents/inventory-report',
        headers: { 'Content-Type': 'application/json' },
        body: {
          userId: Matchers.like('user_001'),
          includePrices: true,
          organizedBySize: true,
          format: 'pdf',
        },
      },
      willRespondWith: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          jobId: Matchers.like('job_inv_001'),
          documentType: 'inventory_report',
          status: 'processing',
        },
      },
    });

    const res = await postJson(harness.port, '/api/documents/inventory-report', {
      userId: 'user_001',
      includePrices: true,
      organizedBySize: true,
      format: 'pdf',
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.documentType).toBe('inventory_report');
  });

  test('should generate sales report without PII', async () => {
    await harness.provider.addInteraction({
      state: 'user has sales data',
      uponReceiving: 'a request to generate sales report without PII',
      withRequest: {
        method: 'POST',
        path: '/api/documents/sales-report',
        headers: { 'Content-Type': 'application/json' },
        body: {
          userId: Matchers.like('user_001'),
          includePII: false,
          startDate: '2024-01-01',
          endDate: '2024-12-31',
        },
      },
      willRespondWith: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          jobId: Matchers.like('job_sales_001'),
          documentType: 'sales_report',
          status: 'processing',
          piiExcluded: true,
        },
      },
    });

    const res = await postJson(harness.port, '/api/documents/sales-report', {
      userId: 'user_001',
      includePII: false,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.piiExcluded).toBe(true);
  });

  test('should generate Terms of Service', async () => {
    await harness.provider.addInteraction({
      state: 'user needs Terms of Service document',
      uponReceiving: 'a request to generate Terms of Service',
      withRequest: {
        method: 'POST',
        path: '/api/documents/legal-document',
        headers: { 'Content-Type': 'application/json' },
        body: {
          documentType: 'terms_of_service',
          version: '2.0',
          effectiveDate: '2024-01-15',
        },
      },
      willRespondWith: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          jobId: Matchers.like('job_legal_001'),
          documentType: 'terms_of_service',
          status: 'processing',
        },
      },
    });

    const res = await postJson(harness.port, '/api/documents/legal-document', {
      documentType: 'terms_of_service',
      version: '2.0',
      effectiveDate: '2024-01-15',
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.documentType).toBe('terms_of_service');
  });
});
