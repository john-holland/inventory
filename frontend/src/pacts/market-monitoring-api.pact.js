/**
 * PACT Contract: Market Monitoring API Provider
 * Defines contracts for variable flywheel cron and ML warehousing
 */

const { Pact } = require('@pact-foundation/pact');
const path = require('path');

describe('Market Monitoring API PACT Contract', () => {
  const provider = new Pact({
    consumer: 'Frontend',
    provider: 'Market Monitoring API',
    port: 1238,
    log: path.resolve(process.cwd(), 'logs', 'market_monitoring_pact.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2
  });

  beforeAll(() => provider.setup());
  afterEach(() => provider.verify());
  afterAll(() => provider.finalize());

  describe('Cron Frequency Adjustment', () => {
    test('should adjust cron frequency based on market volatility', async () => {
      await provider
        .given('market volatility changed to 25%')
        .uponReceiving('a request to adjust cron frequency')
        .withRequest({
          method: 'POST',
          path: '/api/market/cron/adjust-frequency',
          headers: { 'Content-Type': 'application/json' },
          body: {
            jobId: 'market_monitoring_001',
            currentVolatility: 0.25,
            currentFrequency: 'high',
            apiCallsMade: 85
          }
        })
        .willRespondWith({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            jobId: 'market_monitoring_001',
            previousFrequency: 'high',
            newFrequency: 'veryhigh',
            reason: 'Volatility exceeded 20% threshold',
            intervalMinutes: 15
          }
        });
    });
  });

  describe('Market Volatility', () => {
    test('should return current market volatility', async () => {
      await provider
        .given('market data is available')
        .uponReceiving('a request for current market volatility')
        .withRequest({
          method: 'GET',
          path: '/api/market/volatility/current',
          headers: { 'Accept': 'application/json' }
        })
        .willRespondWith({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            volatility: 0.25,
            trend: 'downward',
            riskLevel: 'high',
            lastUpdated: '2024-01-15T10:00:00Z'
          }
        });
    });
  });

  describe('Market Alert Processing', () => {
    test('should process market alert', async () => {
      await provider
        .given('market alert triggered')
        .uponReceiving('a request to process market alert')
        .withRequest({
          method: 'POST',
          path: '/api/market/alert/process',
          headers: { 'Content-Type': 'application/json' },
          body: {
            alertType: 'downturn',
            severity: 'high',
            message: 'Market downturn detected'
          }
        })
        .willRespondWith({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            processed: true,
            robotsNotified: 3,
            emergencyProtocolsTriggered: true
          }
        });
    });
  });

  describe('ML Warehouse Data', () => {
    test('should return ML warehouse data', async () => {
      await provider
        .given('ML warehouse has collected data')
        .uponReceiving('a request for ML warehouse data')
        .withRequest({
          method: 'GET',
          path: '/api/market/ml-warehouse/data',
          headers: { 'Accept': 'application/json' }
        })
        .willRespondWith({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: {
            totalDataPoints: 1000,
            marketData: {
              volatility: 0.25,
              trend: 'downward',
              correlation: 0.67
            },
            cronMetrics: {
              successRate: 0.95,
              responseTimeMs: 145,
              optimalFrequency: 'veryhigh'
            }
          }
        });
    });
  });
});

