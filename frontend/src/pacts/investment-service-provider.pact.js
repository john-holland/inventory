/**
 * PACT Contract: Investment Service Provider
 * Defines contracts for InvestmentService interactions with other services
 */

const { Pact } = require('@pact-foundation/pact');
const path = require('path');

describe('Investment Service PACT Contract', () => {
  const provider = new Pact({
    consumer: 'InvestmentService',
    provider: 'WalletService',
    port: 1234,
    log: path.resolve(process.cwd(), 'logs', 'pact.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2
  });

  beforeAll(() => provider.setup());
  afterEach(() => provider.verify());
  afterAll(() => provider.finalize());

  describe('Investment Eligibility Checks', () => {
    test('should check shipping hold eligibility', async () => {
      const itemId = 'pact_item_001';
      
      await provider
        .given('item has shipping holds but risky mode disabled')
        .uponReceiving('a request to check shipping hold eligibility')
        .withRequest({
          method: 'GET',
          path: `/api/investment/eligibility/${itemId}/shipping_2x`,
          headers: {
            'Accept': 'application/json'
          }
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            holdType: 'shipping_2x',
            isEligible: false,
            reason: 'Shipping holds reserved for round-trip shipping',
            requirements: ['Enable risky investment mode', 'Deposit anti-collateral']
          }
        });

      // Test the contract
      const response = await fetch(`http://localhost:1234/api/investment/eligibility/${itemId}/shipping_2x`);
      const data = await response.json();
      
      expect(data.isEligible).toBe(false);
      expect(data.reason).toContain('reserved for round-trip shipping');
    });

    test('should check additional hold eligibility', async () => {
      const itemId = 'pact_item_002';
      
      await provider
        .given('item has additional holds')
        .uponReceiving('a request to check additional hold eligibility')
        .withRequest({
          method: 'GET',
          path: `/api/investment/eligibility/${itemId}/additional`,
          headers: {
            'Accept': 'application/json'
          }
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            holdType: 'additional',
            isEligible: true,
            reason: 'Additional holds (3rd x) are immediately investable',
            requirements: []
          }
        });

      const response = await fetch(`http://localhost:1234/api/investment/eligibility/${itemId}/additional`);
      const data = await response.json();
      
      expect(data.isEligible).toBe(true);
      expect(data.reason).toContain('immediately investable');
    });

    test('should check insurance hold eligibility', async () => {
      const itemId = 'pact_item_003';
      
      await provider
        .given('item has insurance holds but has not shipped')
        .uponReceiving('a request to check insurance hold eligibility')
        .withRequest({
          method: 'GET',
          path: `/api/investment/eligibility/${itemId}/insurance`,
          headers: {
            'Accept': 'application/json'
          }
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            holdType: 'insurance',
            isEligible: false,
            reason: 'Insurance holds investable only after item ships',
            requirements: ['Wait for item to ship']
          }
        });

      const response = await fetch(`http://localhost:1234/api/investment/eligibility/${itemId}/insurance`);
      const data = await response.json();
      
      expect(data.isEligible).toBe(false);
      expect(data.reason).toContain('after item ships');
    });
  });

  describe('Risky Mode Activation', () => {
    test('should enable risky investment mode', async () => {
      const itemId = 'pact_item_004';
      const requestBody = {
        riskPercentage: 50,
        antiCollateral: 15.00
      };
      
      await provider
        .given('item has shipping holds and sufficient anti-collateral')
        .uponReceiving('a request to enable risky investment mode')
        .withRequest({
          method: 'POST',
          path: `/api/investment/risky-mode/${itemId}`,
          headers: {
            'Content-Type': 'application/json'
          },
          body: requestBody
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            success: true,
            itemId: itemId,
            riskPercentage: 50,
            antiCollateral: 15.00,
            amountAtRisk: 30.00,
            riskBoundaryError: 0.15
          }
        });

      const response = await fetch(`http://localhost:1234/api/investment/risky-mode/${itemId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.riskPercentage).toBe(50);
      expect(data.antiCollateral).toBe(15.00);
    });

    test('should reject invalid anti-collateral', async () => {
      const itemId = 'pact_item_005';
      const requestBody = {
        riskPercentage: 60,
        antiCollateral: 5.00 // Too low
      };
      
      await provider
        .given('item has shipping holds but insufficient anti-collateral')
        .uponReceiving('a request to enable risky investment mode with invalid anti-collateral')
        .withRequest({
          method: 'POST',
          path: `/api/investment/risky-mode/${itemId}`,
          headers: {
            'Content-Type': 'application/json'
          },
          body: requestBody
        })
        .willRespondWith({
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            success: false,
            error: 'Anti-collateral must equal opposite of risk boundary error',
            expectedAntiCollateral: 12.00,
            providedAntiCollateral: 5.00
          }
        });

      const response = await fetch(`http://localhost:1234/api/investment/risky-mode/${itemId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      const data = await response.json();
      
      expect(data.success).toBe(false);
      expect(data.error).toContain('Anti-collateral must equal');
    });
  });

  describe('Hold Investment Operations', () => {
    test('should invest additional hold', async () => {
      const itemId = 'pact_item_006';
      const requestBody = {
        holdType: 'additional',
        amount: 25.00,
        investmentType: 'crypto'
      };
      
      await provider
        .given('item has investable additional holds')
        .uponReceiving('a request to invest additional hold')
        .withRequest({
          method: 'POST',
          path: `/api/investment/invest/${itemId}`,
          headers: {
            'Content-Type': 'application/json'
          },
          body: requestBody
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            success: true,
            itemId: itemId,
            holdType: 'additional',
            amount: 25.00,
            investmentType: 'crypto',
            transactionId: 'tx_123456789'
          }
        });

      const response = await fetch(`http://localhost:1234/api/investment/invest/${itemId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.holdType).toBe('additional');
      expect(data.amount).toBe(25.00);
    });

    test('should reject investment of non-eligible hold', async () => {
      const itemId = 'pact_item_007';
      const requestBody = {
        holdType: 'shipping_2x',
        amount: 30.00,
        investmentType: 'crypto'
      };
      
      await provider
        .given('item has shipping holds but risky mode disabled')
        .uponReceiving('a request to invest non-eligible shipping hold')
        .withRequest({
          method: 'POST',
          path: `/api/investment/invest/${itemId}`,
          headers: {
            'Content-Type': 'application/json'
          },
          body: requestBody
        })
        .willRespondWith({
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            success: false,
            error: 'Cannot invest shipping_2x hold: Shipping holds reserved for round-trip shipping',
            eligibility: {
              holdType: 'shipping_2x',
              isEligible: false,
              reason: 'Shipping holds reserved for round-trip shipping'
            }
          }
        });

      const response = await fetch(`http://localhost:1234/api/investment/invest/${itemId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      const data = await response.json();
      
      expect(data.success).toBe(false);
      expect(data.error).toContain('Cannot invest shipping_2x hold');
    });
  });

  describe('Fallout Scenario Handling', () => {
    test('should handle fallout scenario', async () => {
      const itemId = 'pact_item_008';
      const requestBody = {
        totalLoss: 75.00,
        borrowerShare: 20.00,
        ownerShare: 20.00,
        shippingRefund: 15.00,
        insuranceRefund: 5.00,
        investmentLoss: 35.00
      };
      
      await provider
        .given('item has risky investment mode enabled and investment failed')
        .uponReceiving('a request to handle fallout scenario')
        .withRequest({
          method: 'POST',
          path: `/api/investment/fallout/${itemId}`,
          headers: {
            'Content-Type': 'application/json'
          },
          body: requestBody
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            success: true,
            itemId: itemId,
            falloutProcessed: true,
            borrowerRefund: 20.00,
            ownerRefund: 20.00,
            capitalLoss: 35.00,
            riskyModeDisabled: true
          }
        });

      const response = await fetch(`http://localhost:1234/api/investment/fallout/${itemId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      const data = await response.json();
      
      expect(data.success).toBe(true);
      expect(data.falloutProcessed).toBe(true);
      expect(data.borrowerRefund).toBe(20.00);
      expect(data.ownerRefund).toBe(20.00);
      expect(data.riskyModeDisabled).toBe(true);
    });
  });

  describe('Investment Status Retrieval', () => {
    test('should return complete investment status', async () => {
      const itemId = 'pact_item_009';
      
      await provider
        .given('item has all hold types and risky mode enabled')
        .uponReceiving('a request for investment status')
        .withRequest({
          method: 'GET',
          path: `/api/investment/status/${itemId}`,
          headers: {
            'Accept': 'application/json'
          }
        })
        .willRespondWith({
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            itemId: itemId,
            holdBalance: {
              shippingHold2x: 50.00,
              additionalHold: 35.00,
              insuranceHold: 20.00,
              totalInvestable: 55.00,
              totalNonInvestable: 50.00
            },
            riskyModeEnabled: true,
            riskPercentage: 60,
            antiCollateralRequired: 18.00,
            antiCollateralDeposited: 18.00,
            currentInvestments: 105.00,
            investmentReturn: 5.25,
            investmentReturnPercentage: 5.0,
            robotsActive: true,
            lastUpdated: '2024-01-15T10:30:00Z'
          }
        });

      const response = await fetch(`http://localhost:1234/api/investment/status/${itemId}`);
      const data = await response.json();
      
      expect(data.itemId).toBe(itemId);
      expect(data.holdBalance.shippingHold2x).toBe(50.00);
      expect(data.holdBalance.additionalHold).toBe(35.00);
      expect(data.holdBalance.insuranceHold).toBe(20.00);
      expect(data.riskyModeEnabled).toBe(true);
      expect(data.robotsActive).toBe(true);
    });
  });
});
