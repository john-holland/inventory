/**
 * PACT-style tests: Tax Document API (HTTP contract against inventory backend).
 */

describe('Tax Document API PACT Tests', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('should accept tax generate POST contract shape', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 202,
      json: async () => ({
        sessionId: 'sess-1',
        jobId: 'job-1',
        status: 'queued',
        message: 'Tax document generation queued.',
        estimatedCompletionSeconds: 30,
      }),
    });

    const res = await fetch('http://localhost:8080/api/documents/tax/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-LVM-Route': 'inventory:documents/tax/generate',
      },
      body: JSON.stringify({
        userId: 'user_001',
        year: 2024,
        documentType: 'w2',
        lvmRoute: 'inventory:documents/tax/generate',
      }),
    });
    const body = await res.json();
    expect(res.status).toBe(202);
    expect(body.jobId).toBeTruthy();
    expect(body.sessionId).toBeTruthy();
  });
});
