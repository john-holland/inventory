/**
 * PACT-style tests: market monitoring via frontend InvestmentRobotService (not Python imports).
 */

import { InvestmentRobotService } from '../InvestmentRobotService';

describe('Market Monitoring PACT Tests', () => {
  let robotService;

  beforeEach(() => {
    robotService = InvestmentRobotService.getInstance();
  });

  test('should process market alerts through robot service', async () => {
    const marketAlert = {
      type: 'downturn',
      severity: 'high',
      message: 'Market downturn detected',
      timestamp: new Date().toISOString(),
    };

    await robotService.processMarketAlert(marketAlert);
    const alerts = robotService.getMarketAlerts();
    expect(alerts.length).toBeGreaterThan(0);
  });
});

