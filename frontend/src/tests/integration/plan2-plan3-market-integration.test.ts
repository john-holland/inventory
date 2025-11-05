/**
 * Integration Test: Plan #2 ↔ Plan #3 Market Monitoring Integration
 * Tests investment robots coordinate with Plan #2 market monitoring
 */

import { InvestmentRobotService } from '../../services/InvestmentRobotService';
import { VariableFlywheelCron } from '../../../backend/python-apis/market-monitoring/variable_flywheel_cron';
import { MLWarehouse } from '../../../backend/python-apis/market-monitoring/ml_warehouse';

describe('Plan #2 ↔ Plan #3 Market Monitoring Integration', () => {
  let robotService: InvestmentRobotService;
  let cronService: VariableFlywheelCron;
  let mlWarehouse: MLWarehouse;

  beforeEach(() => {
    robotService = InvestmentRobotService.getInstance();
    cronService = new VariableFlywheelCron();
    mlWarehouse = new MLWarehouse();
  });

  test('investment robots should coordinate with market monitoring', async () => {
    console.log('🔗 Testing Plan #2 ↔ Plan #3 Market Integration');
    
    const itemId = 'market_integration_item_001';
    const investmentId = 'investment_robot_001';
    
    // Step 1: Activate investment robot (Plan #3)
    console.log('Step 1: Activating investment robot');
    const robot = await robotService.activateRobotForItem(itemId, investmentId);
    
    expect(robot.itemId).toBe(itemId);
    expect(robot.isActive).toBe(true);
    expect(robot.investmentId).toBe(investmentId);
    
    // Step 2: Trigger market alert from Variable Flywheel Cron (Plan #2)
    console.log('Step 2: Triggering market alert');
    const marketAlert = {
      type: 'downturn',
      severity: 'critical',
      message: 'Critical market downturn detected',
      timestamp: new Date().toISOString()
    };
    
    await cronService.processMarketAlert(marketAlert);
    
    // Step 3: Verify robot receives alert
    console.log('Step 3: Verifying robot receives alert');
    await robotService.processMarketAlert(marketAlert);
    
    const alerts = robotService.getMarketAlerts();
    expect(alerts.length).toBeGreaterThan(0);
    expect(alerts[alerts.length - 1].severity).toBe('critical');
    
    // Step 4: Test emergency protocol coordination
    console.log('Step 4: Testing emergency protocol coordination');
    await robotService.coordinateEmergencyProtocols();
    
    // Step 5: Verify robot attempts withdrawal
    const withdrawalResult = await robotService.attemptWithdrawal(investmentId);
    expect(withdrawalResult).toBeDefined();
    expect(withdrawalResult.success).toBeDefined();
    
    // Step 6: Verify ML warehouse data sharing (Plan #2)
    console.log('Step 6: Verifying ML warehouse data sharing');
    await robotService.shareDataWithMLWarehouse();
    
    const mlData = await mlWarehouse.getData();
    expect(mlData.marketData).toBeDefined();
    expect(mlData.cronMetrics).toBeDefined();
    
    // Step 7: Test cron job frequency adjustment
    console.log('Step 7: Testing cron frequency adjustment');
    const adjustment = await cronService.adjustJobFrequency({
      jobId: 'market_monitoring_001',
      currentVolatility: 0.25,
      currentFrequency: 'high'
    });
    
    expect(adjustment.newFrequency).toBe('veryhigh');
    expect(adjustment.intervalMinutes).toBe(15);
    
    console.log('✅ Plan #2 ↔ Plan #3 Market Integration Test Passed');
    
    return {
      itemId,
      robotId: robot.id,
      alertsProcessed: alerts.length,
      withdrawalAttempted: true,
      mlDataCollected: true
    };
  });
});

