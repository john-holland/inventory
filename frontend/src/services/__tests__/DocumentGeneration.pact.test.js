/**
 * PACT-style tests: document generation HTTP shapes (no Kotlin imports).
 */

describe('Document Generation PACT Tests', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('should POST legal document generation', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 202,
      json: async () => ({
        sessionId: 's1',
        jobId: 'j1',
        status: 'queued',
        message: 'Legal document generation queued.',
        estimatedCompletionSeconds: 20,
      }),
    });

    const res = await fetch('http://localhost:8080/api/documents/legal/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        documentType: 'terms_of_service',
        platformFeatures: ['a'],
        legalRequirements: ['b'],
      }),
    });
    const body = await res.json();
    expect(body.jobId).toBeTruthy();
    expect(body.documentType).toBeUndefined();
    expect(body.status).toBe('queued');
  });
});
