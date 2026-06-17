/** @jest-environment node */

const { Matchers } = require('@pact-foundation/pact');
const { getJson, postJson } = require('./pactHttp');
const { createPactHarness } = require('./pactTestHarness');

const harness = createPactHarness({
  consumer: 'Frontend',
  provider: 'Market Monitoring API',
  logName: 'market_monitoring_pact',
});

describe('Market Monitoring API PACT Contract', () => {
  beforeAll(() => harness.resetPactFile());
  beforeEach(async () => harness.setup());
  afterEach(async () => harness.verify());
  afterAll(async () => harness.finalize());

  test('should adjust cron frequency based on market volatility', async () => {
    await harness.provider.addInteraction({
      state: 'market volatility changed to 25%',
      uponReceiving: 'a request to adjust cron frequency',
      withRequest: {
        method: 'POST',
        path: '/api/market/cron/adjust-frequency',
        headers: { 'Content-Type': 'application/json' },
        body: {
          jobId: Matchers.like('market_monitoring_001'),
          currentVolatility: 0.25,
          currentFrequency: 'high',
          apiCallsMade: 85,
        },
      },
      willRespondWith: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          jobId: 'market_monitoring_001',
          previousFrequency: 'high',
          newFrequency: 'veryhigh',
          reason: Matchers.like('Volatility exceeded 20% threshold'),
          intervalMinutes: 15,
        },
      },
    });

    const res = await postJson(harness.port, '/api/market/cron/adjust-frequency', {
      jobId: 'market_monitoring_001',
      currentVolatility: 0.25,
      currentFrequency: 'high',
      apiCallsMade: 85,
    });
    expect(res.status).toBe(200);
    expect((await res.json()).newFrequency).toBe('veryhigh');
  });

  test('should return current market volatility', async () => {
    await harness.provider.addInteraction({
      state: 'market data is available',
      uponReceiving: 'a request for current market volatility',
      withRequest: {
        method: 'GET',
        path: '/api/market/volatility/current',
        headers: { Accept: 'application/json' },
      },
      willRespondWith: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          volatility: 0.25,
          trend: 'downward',
          riskLevel: 'high',
          lastUpdated: Matchers.like('2024-01-15T10:00:00Z'),
        },
      },
    });

    const res = await getJson(harness.port, '/api/market/volatility/current', { Accept: 'application/json' });
    expect(res.status).toBe(200);
    expect((await res.json()).volatility).toBe(0.25);
  });

  test('should process market alert', async () => {
    await harness.provider.addInteraction({
      state: 'market alert triggered',
      uponReceiving: 'a request to process market alert',
      withRequest: {
        method: 'POST',
        path: '/api/market/alert/process',
        headers: { 'Content-Type': 'application/json' },
        body: {
          alertType: 'downturn',
          severity: 'high',
          message: Matchers.like('Market downturn detected'),
        },
      },
      willRespondWith: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          processed: true,
          robotsNotified: 3,
          emergencyProtocolsTriggered: true,
        },
      },
    });

    const res = await postJson(harness.port, '/api/market/alert/process', {
      alertType: 'downturn',
      severity: 'high',
      message: 'Market downturn detected',
    });
    expect(res.status).toBe(200);
    expect((await res.json()).processed).toBe(true);
  });

  test('should return ML warehouse data', async () => {
    await harness.provider.addInteraction({
      state: 'ML warehouse has collected data',
      uponReceiving: 'a request for ML warehouse data',
      withRequest: {
        method: 'GET',
        path: '/api/market/ml-warehouse/data',
        headers: { Accept: 'application/json' },
      },
      willRespondWith: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          totalDataPoints: 1000,
          marketData: {
            volatility: 0.25,
            trend: 'downward',
            correlation: 0.67,
          },
          cronMetrics: {
            successRate: 0.95,
            responseTimeMs: 145,
            optimalFrequency: 'veryhigh',
          },
        },
      },
    });

    const res = await getJson(harness.port, '/api/market/ml-warehouse/data', { Accept: 'application/json' });
    expect(res.status).toBe(200);
    expect((await res.json()).totalDataPoints).toBe(1000);
  });
});
