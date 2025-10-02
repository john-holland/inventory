// Buffing Detection Integration Example
// This shows how to integrate the buffing detection service into your existing components

import { buffingDetectionService, TransactionRecord } from '../services/BuffingDetectionService';

export class BuffingDetectionExample {
  
  // Example: Integrate with your existing InventoryService
  static async monitorTransaction(
    userId: string,
    transactionType: 'lend' | 'borrow' | 'return' | 'early_return' | 'buyout',
    counterparty: string,
    itemId: string,
    shippingCost: number,
    additionalProtection: number,
    reputationChange: number
  ) {
    // Create transaction record for monitoring
    const transaction: TransactionRecord = {
      id: `${userId}-${Date.now()}`,
      timestamp: new Date(),
      type: transactionType,
      counterparty,
      reputationChange,
      itemId,
      shippingCost,
      additionalProtection
    };

    // Get current reputation (you'd get this from your smart contract)
    const currentReputation = 100; // This would come from your contract

    // Analyze the transaction (this runs independently)
    const analysis = await buffingDetectionService.analyzeTransaction(
      userId,
      transaction,
      currentReputation
    );

    // Log findings (but don't affect the main platform)
    if (analysis.isFlagged) {
      console.log(`🚨 Suspicious activity detected for user ${userId}:`);
      console.log(`   Risk Score: ${(analysis.riskScore * 100).toFixed(1)}%`);
      console.log(`   Flags: ${analysis.flags.join(', ')}`);
      console.log(`   Confidence: ${(analysis.confidence * 100).toFixed(1)}%`);
      
      // You could send this to a monitoring dashboard or alert system
      this.sendAlert(analysis);
    }

    return analysis;
  }

  // Example: Get monitoring statistics
  static getMonitoringStats() {
    const stats = buffingDetectionService.getNetworkStatistics();
    const highRiskUsers = buffingDetectionService.getHighRiskUsers();
    const collusionRings = buffingDetectionService.getCollusionRings();

    return {
      stats,
      highRiskUsers: highRiskUsers.length,
      collusionRings: collusionRings.length,
      lastUpdated: new Date()
    };
  }

  // Example: Export analysis for external review
  static exportUserAnalysis(userId: string) {
    const analysis = buffingDetectionService.exportAnalysis(userId);
    if (analysis) {
      // Convert to JSON for export
      const jsonData = JSON.stringify(analysis, null, 2);
      
      // Create downloadable file
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `buffing-analysis-${userId}.json`;
      link.click();
      URL.revokeObjectURL(url);
      
      return true;
    }
    return false;
  }

  // Example: Integration with your existing component
  static integrateWithInventoryList() {
    // This would be called from your InventoryList component
    // when transactions occur
    
    const exampleUsage = `
    // In your InventoryList.tsx or similar component:
    
    import { BuffingDetectionExample } from './BuffingDetectionExample';
    
    // When a lending transaction occurs:
    const handleLendItem = async (itemId: string, borrower: string) => {
      // Your existing lending logic
      const result = await lendItem(itemId, borrower);
      
      // Monitor the transaction (runs independently)
      BuffingDetectionExample.monitorTransaction(
        borrower,
        'borrow',
        currentUser.address,
        itemId,
        shippingCost,
        additionalProtection,
        reputationChange
      );
      
      return result;
    };
    
    // When a return transaction occurs:
    const handleReturnItem = async (itemId: string) => {
      // Your existing return logic
      const result = await returnItem(itemId);
      
      // Monitor the transaction
      BuffingDetectionExample.monitorTransaction(
        currentUser.address,
        'return',
        itemOwner,
        itemId,
        0,
        0,
        reputationChange
      );
      
      return result;
    };
    `;
    
    return exampleUsage;
  }

  // Example: Alert system (you can customize this)
  private static sendAlert(analysis: any) {
    // This could send alerts to:
    // - Slack/Discord webhook
    // - Email notification
    // - Dashboard update
    // - External monitoring service
    
    const alertData = {
      userId: analysis.userId,
      riskScore: analysis.riskScore,
      flags: analysis.flags,
      confidence: analysis.confidence,
      timestamp: new Date().toISOString(),
      type: 'buffing_detection_alert'
    };

    // Example: Send to external monitoring service
    fetch('/api/monitoring/alerts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(alertData)
    }).catch(error => {
      console.log('Failed to send alert:', error);
    });
  }

  // Example: Dashboard integration
  static getDashboardData() {
    const stats = this.getMonitoringStats();
    const highRiskUsers = buffingDetectionService.getHighRiskUsers();
    
    return {
      overview: {
        totalUsers: stats.stats.totalUsers,
        highRiskUsers: stats.highRiskUsers,
        collusionRings: stats.collusionRings,
        lastUpdated: stats.lastUpdated
      },
      topRisks: highRiskUsers.slice(0, 5).map(user => ({
        userId: user.userId,
        riskScore: user.riskScore,
        flags: user.flags,
        confidence: user.confidence
      })),
      trends: {
        // You could add trend analysis here
        riskLevels: {
          low: highRiskUsers.filter(u => u.riskScore < 0.5).length,
          medium: highRiskUsers.filter(u => u.riskScore >= 0.5 && u.riskScore < 0.8).length,
          high: highRiskUsers.filter(u => u.riskScore >= 0.8).length
        }
      }
    };
  }

  // Example: Reset for testing
  static resetMonitoring() {
    buffingDetectionService.reset();
    console.log('Monitoring system reset for testing');
  }
}

// Usage examples:
export const usageExamples = {
  basic: `
    // Basic transaction monitoring
    BuffingDetectionExample.monitorTransaction(
      '0x1234...',
      'borrow',
      '0x5678...',
      'item-123',
      25,
      10,
      5
    );
  `,
  
  dashboard: `
    // Get dashboard data
    const dashboardData = BuffingDetectionExample.getDashboardData();
    console.log('High risk users:', dashboardData.overview.highRiskUsers);
  `,
  
  export: `
    // Export user analysis
    BuffingDetectionExample.exportUserAnalysis('0x1234...');
  `,
  
  stats: `
    // Get monitoring statistics
    const stats = BuffingDetectionExample.getMonitoringStats();
    console.log('Total users monitored:', stats.stats.totalUsers);
  `
}; 