/**
 * PACT Tests for Market Monitoring API Provider
 */

import { VariableFlywheelCron } from '../../../backend/python-apis/market-monitoring/variable_flywheel_cron';
import { MLWarehouse } from '../../../backend/python-apis/market-monitoring/ml_warehouse';

describe('Market Monitoring PACT Tests', () => {
  let cronService: VariableFlywheelCron;
  let mlWarehouse: MLWarehouse;

  beforeEach(() => {
    cronService = new VariableFlywheelCron();
    mlWarehouse = new MLWarehouse();
  });

  test('should adjust cron frequency based on market volatility', async () => {
    const result = await cronService.adjustJobFrequency({
      jobId: 'market_monitoring_001',
      currentVolatility: 0.25,
      currentFrequency: 'high'
    });

    expect(result.newFrequency).toBe('veryhigh');
    expect(result.intervalMinutes).toBe(15);
  });

  test('should return current market volatility', async () => {
    const volatility = await cronService.getCurrentMarketVolatility();

    expect(volatility.volatility).toBeGreaterThan(0);
    expect(volatility.riskLevel).toBeDefined();
  });

  test('should process market alerts', async () => {
    const result = await cronService.processMarketAlert({
      alertType: 'downturn',
      severity: 'high',
      message: 'Market downturn detected'
    });

    expect(result.processed).toBe(true);
    expect(result.robotsNotified).toBeGreaterThan(0);
  });

  test('should return ML warehouse data', async () => {
    const data = await mlWarehouse.getData();

    expect(data.totalDataPoints).toBeGreaterThan(0);
    expect(data.marketData).toBeDefined();
    expect(data.cronMetrics).toBeDefined();
  });
});

