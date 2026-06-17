/** @jest-environment node */
/**
 * Charity drop-shipping consumer pacts — HTTP contract only (no bridge import).
 */

const { Matchers } = require('@pact-foundation/pact');
const { getJson, postJson } = require('./pactHttp');
const { createPactHarness } = require('./pactTestHarness');

const harness = createPactHarness({
  consumer: 'charity-lending-service',
  provider: 'drop-shipping-api-bridge',
  logName: 'charity_drop_shipping_pact',
});

describe('Charity Drop Shipping Integration PACT Tests', () => {
  beforeAll(() => harness.resetPactFile());
  beforeEach(async () => harness.setup());
  afterEach(async () => harness.verify());
  afterAll(async () => harness.finalize());

  test('should connect to drop shipping APIs when charity features enabled', async () => {
    await harness.provider.addInteraction({
      state: 'charity features enabled',
      uponReceiving: 'a request to connect to drop shipping APIs',
      withRequest: {
        method: 'POST',
        path: '/api/connect',
        headers: { 'Content-Type': 'application/json' },
        body: {
          charityFeaturesEnabled: true,
          platforms: ['amazon', 'ebay', 'walmart'],
        },
      },
      willRespondWith: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          success: true,
          connectedPlatforms: ['amazon', 'ebay', 'walmart'],
          complianceStatus: 'compliant',
        },
      },
    });

    const res = await postJson(harness.port, '/api/connect', {
      charityFeaturesEnabled: true,
      platforms: ['amazon', 'ebay', 'walmart'],
    });
    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
  });

  test('should lookup charity item info', async () => {
    const platform = 'amazon';
    const itemId = 'B08N5WRWNW';
    await harness.provider.addInteraction({
      state: 'charity item lookup',
      uponReceiving: 'a request to lookup charity item info',
      withRequest: {
        method: 'GET',
        path: `/api/items/${platform}/${itemId}`,
        headers: {
          'Content-Type': 'application/json',
          'X-Charity-ID': 'charity-123',
        },
      },
      willRespondWith: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          platform,
          itemId,
          title: Matchers.like('Test Charity Item'),
          price: 25.99,
          available: true,
          charityEligible: true,
          lastChecked: Matchers.like('2024-01-01T00:00:00Z'),
        },
      },
    });

    const res = await getJson(harness.port, `/api/items/${platform}/${itemId}`, {
      'Content-Type': 'application/json',
      'X-Charity-ID': 'charity-123',
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.charityEligible).toBe(true);
  });
});
