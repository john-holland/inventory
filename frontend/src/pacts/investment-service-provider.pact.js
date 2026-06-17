/** @jest-environment node */
/**
 * PACT Contract: Investment Service Provider
 */

const { Matchers } = require('@pact-foundation/pact');
const { getJson, postJson } = require('./pactHttp');
const { createPactHarness } = require('./pactTestHarness');

const harness = createPactHarness({
  consumer: 'InvestmentService',
  provider: 'WalletService',
  logName: 'investment_service_pact',
});

describe('Investment Service PACT Contract', () => {
  beforeAll(() => harness.resetPactFile());
  beforeEach(async () => harness.setup());
  afterEach(async () => harness.verify());
  afterAll(async () => harness.finalize());

  test('should check shipping hold eligibility', async () => {
    const itemId = 'pact_item_001';
    await harness.provider.addInteraction({
      state: 'item has shipping holds but risky mode disabled',
      uponReceiving: 'a request to check shipping hold eligibility',
      withRequest: {
        method: 'GET',
        path: `/api/investment/eligibility/${itemId}/shipping_2x`,
        headers: { Accept: 'application/json' },
      },
      willRespondWith: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          holdType: 'shipping_2x',
          isEligible: false,
          reason: Matchers.like('Shipping holds reserved for round-trip shipping'),
          requirements: ['Enable risky investment mode', 'Deposit anti-collateral'],
        },
      },
    });

    const res = await getJson(harness.port, `/api/investment/eligibility/${itemId}/shipping_2x`, {
      Accept: 'application/json',
    });
    const data = await res.json();
    expect(data.isEligible).toBe(false);
    expect(data.reason).toContain('reserved for round-trip shipping');
  });

  test('should check additional hold eligibility', async () => {
    const itemId = 'pact_item_002';
    await harness.provider.addInteraction({
      state: 'item has additional holds',
      uponReceiving: 'a request to check additional hold eligibility',
      withRequest: {
        method: 'GET',
        path: `/api/investment/eligibility/${itemId}/additional`,
        headers: { Accept: 'application/json' },
      },
      willRespondWith: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          holdType: 'additional',
          isEligible: true,
          reason: Matchers.like('Additional holds (3rd x) are immediately investable'),
          requirements: [],
        },
      },
    });

    const data = await (await getJson(harness.port, `/api/investment/eligibility/${itemId}/additional`, { Accept: 'application/json' })).json();
    expect(data.isEligible).toBe(true);
  });

  test('should check insurance hold eligibility', async () => {
    const itemId = 'pact_item_003';
    await harness.provider.addInteraction({
      state: 'item has insurance holds but has not shipped',
      uponReceiving: 'a request to check insurance hold eligibility',
      withRequest: {
        method: 'GET',
        path: `/api/investment/eligibility/${itemId}/insurance`,
        headers: { Accept: 'application/json' },
      },
      willRespondWith: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          holdType: 'insurance',
          isEligible: false,
          reason: Matchers.like('Insurance holds investable only after item ships'),
          requirements: ['Wait for item to ship'],
        },
      },
    });

    const data = await (await getJson(harness.port, `/api/investment/eligibility/${itemId}/insurance`, { Accept: 'application/json' })).json();
    expect(data.isEligible).toBe(false);
  });

  test('should enable risky investment mode', async () => {
    const itemId = 'pact_item_004';
    const requestBody = { riskPercentage: 50, antiCollateral: 15.0 };
    await harness.provider.addInteraction({
      state: 'item has shipping holds and sufficient anti-collateral',
      uponReceiving: 'a request to enable risky investment mode',
      withRequest: {
        method: 'POST',
        path: `/api/investment/risky-mode/${itemId}`,
        headers: { 'Content-Type': 'application/json' },
        body: requestBody,
      },
      willRespondWith: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          success: true,
          itemId,
          riskPercentage: 50,
          antiCollateral: 15.0,
          amountAtRisk: 30.0,
          riskBoundaryError: 0.15,
        },
      },
    });

    const data = await (await postJson(harness.port, `/api/investment/risky-mode/${itemId}`, requestBody)).json();
    expect(data.success).toBe(true);
  });

  test('should reject invalid anti-collateral', async () => {
    const itemId = 'pact_item_005';
    const requestBody = { riskPercentage: 60, antiCollateral: 5.0 };
    await harness.provider.addInteraction({
      state: 'item has shipping holds but insufficient anti-collateral',
      uponReceiving: 'a request to enable risky investment mode with invalid anti-collateral',
      withRequest: {
        method: 'POST',
        path: `/api/investment/risky-mode/${itemId}`,
        headers: { 'Content-Type': 'application/json' },
        body: requestBody,
      },
      willRespondWith: {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: {
          success: false,
          error: Matchers.like('Anti-collateral must equal opposite of risk boundary error'),
          expectedAntiCollateral: 12.0,
          providedAntiCollateral: 5.0,
        },
      },
    });

    const res = await postJson(harness.port, `/api/investment/risky-mode/${itemId}`, requestBody);
    expect(res.status).toBe(400);
    expect((await res.json()).success).toBe(false);
  });

  test('should invest additional hold', async () => {
    const itemId = 'pact_item_006';
    const requestBody = { holdType: 'additional', amount: 25.0, investmentType: 'crypto' };
    await harness.provider.addInteraction({
      state: 'item has investable additional holds',
      uponReceiving: 'a request to invest additional hold',
      withRequest: {
        method: 'POST',
        path: `/api/investment/invest/${itemId}`,
        headers: { 'Content-Type': 'application/json' },
        body: requestBody,
      },
      willRespondWith: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          success: true,
          itemId,
          holdType: 'additional',
          amount: 25.0,
          investmentType: 'crypto',
          transactionId: Matchers.like('tx_123456789'),
        },
      },
    });

    const data = await (await postJson(harness.port, `/api/investment/invest/${itemId}`, requestBody)).json();
    expect(data.success).toBe(true);
  });

  test('should reject investment of non-eligible hold', async () => {
    const itemId = 'pact_item_007';
    const requestBody = { holdType: 'shipping_2x', amount: 30.0, investmentType: 'crypto' };
    await harness.provider.addInteraction({
      state: 'item has shipping holds but risky mode disabled',
      uponReceiving: 'a request to invest non-eligible shipping hold',
      withRequest: {
        method: 'POST',
        path: `/api/investment/invest/${itemId}`,
        headers: { 'Content-Type': 'application/json' },
        body: requestBody,
      },
      willRespondWith: {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
        body: {
          success: false,
          error: Matchers.like('Cannot invest shipping_2x hold'),
          eligibility: {
            holdType: 'shipping_2x',
            isEligible: false,
            reason: Matchers.like('Shipping holds reserved'),
          },
        },
      },
    });

    const res = await postJson(harness.port, `/api/investment/invest/${itemId}`, requestBody);
    expect(res.status).toBe(400);
  });

  test('should handle fallout scenario', async () => {
    const itemId = 'pact_item_008';
    const requestBody = {
      totalLoss: 75.0,
      borrowerShare: 20.0,
      ownerShare: 20.0,
      shippingRefund: 15.0,
      insuranceRefund: 5.0,
      investmentLoss: 35.0,
    };
    await harness.provider.addInteraction({
      state: 'item has risky investment mode enabled and investment failed',
      uponReceiving: 'a request to handle fallout scenario',
      withRequest: {
        method: 'POST',
        path: `/api/investment/fallout/${itemId}`,
        headers: { 'Content-Type': 'application/json' },
        body: requestBody,
      },
      willRespondWith: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          success: true,
          itemId,
          falloutProcessed: true,
          borrowerRefund: 20.0,
          ownerRefund: 20.0,
          capitalLoss: 35.0,
          riskyModeDisabled: true,
        },
      },
    });

    const data = await (await postJson(harness.port, `/api/investment/fallout/${itemId}`, requestBody)).json();
    expect(data.falloutProcessed).toBe(true);
  });

  test('should return complete investment status', async () => {
    const itemId = 'pact_item_009';
    await harness.provider.addInteraction({
      state: 'item has all hold types and risky mode enabled',
      uponReceiving: 'a request for investment status',
      withRequest: {
        method: 'GET',
        path: `/api/investment/status/${itemId}`,
        headers: { Accept: 'application/json' },
      },
      willRespondWith: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          itemId,
          holdBalance: {
            shippingHold2x: 50.0,
            additionalHold: 35.0,
            insuranceHold: 20.0,
            totalInvestable: 55.0,
            totalNonInvestable: 50.0,
          },
          riskyModeEnabled: true,
          riskPercentage: 60,
          antiCollateralRequired: 18.0,
          antiCollateralDeposited: 18.0,
          currentInvestments: 105.0,
          investmentReturn: 5.25,
          investmentReturnPercentage: 5.0,
          robotsActive: true,
          lastUpdated: Matchers.like('2024-01-15T10:30:00Z'),
        },
      },
    });

    const data = await (await getJson(harness.port, `/api/investment/status/${itemId}`, { Accept: 'application/json' })).json();
    expect(data.riskyModeEnabled).toBe(true);
    expect(data.robotsActive).toBe(true);
  });
});
