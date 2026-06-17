/** @jest-environment node */

const { Matchers } = require('@pact-foundation/pact');
const { getJson, postJson } = require('./pactHttp');
const { createPactHarness } = require('./pactTestHarness');

const harness = createPactHarness({
  consumer: 'Frontend',
  provider: 'Tax Document API',
  logName: 'tax_document_pact',
});

describe('Tax Document API PACT Contract', () => {
  beforeAll(() => harness.resetPactFile());
  beforeEach(async () => harness.setup());
  afterEach(async () => harness.verify());
  afterAll(async () => harness.finalize());

  test('should generate W2 document', async () => {
    await harness.provider.addInteraction({
      state: 'user has employment data for 2024',
      uponReceiving: 'a request to generate W2 document',
      withRequest: {
        method: 'POST',
        path: '/api/tax/generate-w2',
        headers: { 'Content-Type': 'application/json' },
        body: {
          userId: Matchers.like('user_001'),
          year: 2024,
          wages: 75000.0,
          federalWithheld: 12000.0,
          stateWithheld: 4500.0,
        },
      },
      willRespondWith: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          jobId: Matchers.like('job_123456'),
          documentType: 'w2',
          status: 'processing',
          estimatedCompletion: Matchers.like('2024-01-15T10:05:00Z'),
        },
      },
    });

    const res = await postJson(harness.port, '/api/tax/generate-w2', {
      userId: 'user_001',
      year: 2024,
      wages: 75000.0,
      federalWithheld: 12000.0,
      stateWithheld: 4500.0,
    });
    expect(res.status).toBe(200);
    expect((await res.json()).documentType).toBe('w2');
  });

  test('should generate 1099-C document', async () => {
    await harness.provider.addInteraction({
      state: 'debt cancellation occurred',
      uponReceiving: 'a request to generate 1099-C document',
      withRequest: {
        method: 'POST',
        path: '/api/tax/generate-1099c',
        headers: { 'Content-Type': 'application/json' },
        body: {
          creditorName: Matchers.like('Bank ABC'),
          debtorName: Matchers.like('John Doe'),
          debtAmount: 5000.0,
          cancellationDate: '2024-01-01',
        },
      },
      willRespondWith: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          jobId: Matchers.like('job_789012'),
          documentType: '1099c',
          status: 'processing',
          estimatedCompletion: Matchers.like('2024-01-15T10:05:00Z'),
        },
      },
    });

    const res = await postJson(harness.port, '/api/tax/generate-1099c', {
      creditorName: 'Bank ABC',
      debtorName: 'John Doe',
      debtAmount: 5000.0,
      cancellationDate: '2024-01-01',
    });
    expect(res.status).toBe(200);
    expect((await res.json()).documentType).toBe('1099c');
  });

  test('should generate capital loss report', async () => {
    await harness.provider.addInteraction({
      state: 'investment fallout scenario occurred',
      uponReceiving: 'a request to generate capital loss report',
      withRequest: {
        method: 'POST',
        path: '/api/tax/generate-capital-loss',
        headers: { 'Content-Type': 'application/json' },
        body: {
          userId: Matchers.like('user_001'),
          itemId: Matchers.like('item_001'),
          borrowerCapitalLoss: 25.0,
          ownerCapitalLoss: 25.0,
          totalInvestmentLoss: 50.0,
          falloutDate: Matchers.like('2024-01-15T10:00:00Z'),
        },
      },
      willRespondWith: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          jobId: Matchers.like('job_345678'),
          documentType: 'capital_loss_report',
          status: 'processing',
          estimatedCompletion: Matchers.like('2024-01-15T10:05:00Z'),
          borrowerCapitalLoss: 25.0,
          ownerCapitalLoss: 25.0,
        },
      },
    });

    const res = await postJson(harness.port, '/api/tax/generate-capital-loss', {
      userId: 'user_001',
      itemId: 'item_001',
      borrowerCapitalLoss: 25.0,
      ownerCapitalLoss: 25.0,
      totalInvestmentLoss: 50.0,
      falloutDate: '2024-01-15T10:00:00Z',
    });
    expect(res.status).toBe(200);
    expect((await res.json()).documentType).toBe('capital_loss_report');
  });

  test('should return document generation status', async () => {
    await harness.provider.addInteraction({
      state: 'document generation job is in progress',
      uponReceiving: 'a request for document status',
      withRequest: {
        method: 'GET',
        path: '/api/tax/document-status/job_123456',
        headers: { Accept: 'application/json' },
      },
      willRespondWith: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          jobId: 'job_123456',
          status: 'completed',
          documentId: Matchers.like('doc_123456'),
          downloadUrl: Matchers.like('/api/tax/download/doc_123456'),
          completedAt: Matchers.like('2024-01-15T10:05:00Z'),
        },
      },
    });

    const res = await getJson(harness.port, '/api/tax/document-status/job_123456', {
      Accept: 'application/json',
    });
    expect(res.status).toBe(200);
    expect((await res.json()).status).toBe('completed');
  });

  test('should download completed document', async () => {
    await harness.provider.addInteraction({
      state: 'document generation is completed',
      uponReceiving: 'a request to download document',
      withRequest: {
        method: 'GET',
        path: '/api/tax/download/doc_123456',
        headers: { Accept: 'application/pdf' },
      },
      willRespondWith: {
        status: 200,
        headers: { 'Content-Type': 'application/pdf' },
        body: 'PDF_BINARY_CONTENT',
      },
    });

    const res = await getJson(harness.port, '/api/tax/download/doc_123456', { Accept: 'application/pdf' });
    expect(res.status).toBe(200);
    expect(res.text()).toBe('PDF_BINARY_CONTENT');
  });
});
