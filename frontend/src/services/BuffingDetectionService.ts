// Standalone Buffing Detection Service
// This service monitors the platform for suspicious patterns without affecting reputation
// or marking accounts. It's designed to run independently and build intelligence.

export interface ReputationAnalysis {
  userId: string;
  currentReputation: number;
  reputationHistory: number[];
  transactionHistory: TransactionRecord[];
  behavioralScore: number;
  networkRisk: number;
  temporalAnomaly: number;
  riskScore: number;
  flags: string[];
  lastUpdated: Date;
  isFlagged: boolean;
  confidence: number;
}

export interface TransactionRecord {
  id: string;
  timestamp: Date;
  type: 'lend' | 'borrow' | 'return' | 'early_return' | 'buyout';
  counterparty: string;
  reputationChange: number;
  itemId: string;
  shippingCost: number;
  additionalProtection: number;
}

export interface NetworkNode {
  address: string;
  reputation: number;
  connections: string[];
  transactionCount: number;
  avgTransactionValue: number;
  lastActivity: Date;
}

export interface CollusionRing {
  members: string[];
  pattern: 'circular' | 'hub' | 'star' | 'chain';
  riskScore: number;
  evidence: string[];
  firstDetected: Date;
  lastActivity: Date;
}

// Kalman Filter for reputation tracking
class KalmanFilter {
  private P: number = 1.0; // Uncertainty
  private x: number = 100; // Initial reputation estimate
  private Q: number;
  private R: number;

  constructor(Q: number, R: number) {
    this.Q = Q;
    this.R = R;
  }

  update(measurement: number): { estimate: number; gain: number } {
    // Predict
    const P_pred = this.P + this.Q;
    
    // Update
    const K = P_pred / (P_pred + this.R); // Kalman gain
    this.x = this.x + K * (measurement - this.x);
    this.P = (1 - K) * P_pred;
    
    return { estimate: this.x, gain: K };
  }

  getEstimate(): number {
    return this.x;
  }
}

// Behavioral clustering for pattern recognition
class BehavioralCluster {
  public centroid: number[];
  public members: string[] = [];
  public variance: number = 0;

  constructor(centroid: number[]) {
    this.centroid = centroid;
  }

  addMember(userId: string, features: number[]): void {
    this.members.push(userId);
    this.updateCentroid();
  }

  private updateCentroid(): void {
    // Recalculate centroid based on all members
    // This is a simplified version - in practice you'd use proper clustering
  }

  distance(features: number[]): number {
    return Math.sqrt(
      features.reduce((sum, feature, i) => 
        sum + Math.pow(feature - this.centroid[i], 2), 0)
    );
  }
}

export class BuffingDetectionService {
  private reputationAnalyses: Map<string, ReputationAnalysis> = new Map();
  private networkGraph: Map<string, NetworkNode> = new Map();
  private collusionRings: CollusionRing[] = [];
  private kalmanFilters: Map<string, KalmanFilter> = new Map();
  private behavioralClusters: BehavioralCluster[] = [];
  
  // Configuration
  private readonly KALMAN_Q = 0.1; // Process noise
  private readonly KALMAN_R = 0.5; // Measurement noise
  private readonly RISK_THRESHOLD = 0.7;
  private readonly MIN_CONFIDENCE = 0.6;
  
  constructor() {
    console.log('🔍 Buffing Detection Service initialized - monitoring in stealth mode');
  }

  // Main detection method - called when new transaction occurs
  public async analyzeTransaction(
    userId: string,
    transaction: TransactionRecord,
    currentReputation: number
  ): Promise<ReputationAnalysis> {
    console.log(`🔍 Analyzing transaction for user ${userId}...`);

    // Get or create user analysis
    let analysis = this.reputationAnalyses.get(userId);
    if (!analysis) {
      analysis = this.initializeUserAnalysis(userId, currentReputation);
    }

    // Update transaction history
    analysis.transactionHistory.push(transaction);
    analysis.reputationHistory.push(currentReputation);

    // Run detection algorithms
    const kalmanResult = this.runKalmanAnalysis(userId, currentReputation);
    const behavioralResult = this.runBehavioralAnalysis(userId, analysis);
    const networkResult = this.runNetworkAnalysis(userId, transaction);
    const temporalResult = this.runTemporalAnalysis(analysis);

    // Calculate composite risk score
    analysis.riskScore = this.calculateRiskScore({
      kalman: kalmanResult,
      behavioral: behavioralResult,
      network: networkResult,
      temporal: temporalResult
    });

    // Update flags and confidence
    analysis.flags = this.generateFlags({
      kalman: kalmanResult,
      behavioral: behavioralResult,
      network: networkResult,
      temporal: temporalResult
    });

    analysis.isFlagged = analysis.riskScore > this.RISK_THRESHOLD;
    analysis.confidence = this.calculateConfidence(analysis);
    analysis.lastUpdated = new Date();

    // Update stored analysis
    this.reputationAnalyses.set(userId, analysis);

    // Log findings (but don't affect main platform)
    if (analysis.isFlagged) {
      console.log(`🚨 High-risk user detected: ${userId} (Risk: ${analysis.riskScore.toFixed(2)})`);
      console.log(`   Flags: ${analysis.flags.join(', ')}`);
    }

    return analysis;
  }

  private initializeUserAnalysis(userId: string, initialReputation: number): ReputationAnalysis {
    const analysis: ReputationAnalysis = {
      userId,
      currentReputation: initialReputation,
      reputationHistory: [initialReputation],
      transactionHistory: [],
      behavioralScore: 0,
      networkRisk: 0,
      temporalAnomaly: 0,
      riskScore: 0,
      flags: [],
      lastUpdated: new Date(),
      isFlagged: false,
      confidence: 0
    };

    // Initialize Kalman filter
    this.kalmanFilters.set(userId, new KalmanFilter(this.KALMAN_Q, this.KALMAN_R));

    return analysis;
  }

  private runKalmanAnalysis(userId: string, currentReputation: number): any {
    const kalman = this.kalmanFilters.get(userId);
    if (!kalman) return { anomaly: 0, prediction: currentReputation };

    const result = kalman.update(currentReputation);
    const anomaly = Math.abs(currentReputation - result.estimate);
    
    return {
      anomaly,
      prediction: result.estimate,
      gain: result.gain
    };
  }

  private runBehavioralAnalysis(userId: string, analysis: ReputationAnalysis): any {
    const features = this.extractBehavioralFeatures(analysis);
    
    // Find nearest behavioral cluster
    let minDistance = Infinity;
    let nearestCluster: BehavioralCluster | null = null;

    for (const cluster of this.behavioralClusters) {
      const distance = cluster.distance(features);
      if (distance < minDistance) {
        minDistance = distance;
        nearestCluster = cluster;
      }
    }

    // If no nearby cluster, create new one
    if (!nearestCluster || minDistance > 0.5) {
      nearestCluster = new BehavioralCluster(features);
      this.behavioralClusters.push(nearestCluster);
    }

    nearestCluster.addMember(userId, features);

    return {
      clusterDistance: minDistance,
      clusterSize: nearestCluster.members.length,
      anomaly: minDistance > 0.3 ? 1 : 0
    };
  }

  private extractBehavioralFeatures(analysis: ReputationAnalysis): number[] {
    const history = analysis.transactionHistory;
    if (history.length < 3) return [0, 0, 0, 0, 0];

    const frequencies = this.calculateTransactionFrequencies(history);
    const reputationGrowth = this.calculateReputationGrowth(analysis.reputationHistory);
    const transactionVariance = this.calculateTransactionVariance(history);
    const timePatterns = this.analyzeTimePatterns(history);
    const networkConnectivity = this.calculateNetworkConnectivity(analysis.userId);

    return [
      frequencies.avgFrequency,
      reputationGrowth.rate,
      transactionVariance,
      timePatterns.regularity,
      networkConnectivity
    ];
  }

  private runNetworkAnalysis(userId: string, transaction: TransactionRecord): any {
    // Update network graph
    this.updateNetworkGraph(userId, transaction);

    // Detect collusion patterns
    const collusionRisk = this.detectCollusionPatterns(userId);
    
    // Calculate network centrality
    const centrality = this.calculateNetworkCentrality(userId);

    return {
      collusionRisk,
      centrality,
      connectionCount: this.getConnectionCount(userId)
    };
  }

  private runTemporalAnalysis(analysis: ReputationAnalysis): any {
    if (analysis.reputationHistory.length < 10) {
      return { anomaly: 0, trend: 0 };
    }

    // Simple trend analysis
    const recent = analysis.reputationHistory.slice(-5);
    const older = analysis.reputationHistory.slice(-10, -5);
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    
    const trend = recentAvg - olderAvg;
    const anomaly = Math.abs(trend) > 20 ? 1 : 0;

    return { anomaly, trend };
  }

  private calculateRiskScore(results: any): number {
    let riskScore = 0;

    // Kalman filter anomaly (30% weight)
    if (results.kalman.anomaly > 20) riskScore += 0.3;

    // Behavioral anomaly (25% weight)
    if (results.behavioral.anomaly > 0) riskScore += 0.25;

    // Network collusion risk (30% weight)
    if (results.network.collusionRisk > 0.7) riskScore += 0.3;

    // Temporal anomaly (15% weight)
    if (results.temporal.anomaly > 0) riskScore += 0.15;

    return Math.min(riskScore, 1.0);
  }

  private generateFlags(results: any): string[] {
    const flags: string[] = [];

    if (results.kalman.anomaly > 20) flags.push('unusual_reputation_jump');
    if (results.behavioral.anomaly > 0) flags.push('behavioral_anomaly');
    if (results.network.collusionRisk > 0.7) flags.push('collusion_detected');
    if (results.temporal.anomaly > 0) flags.push('temporal_anomaly');

    return flags;
  }

  private calculateConfidence(analysis: ReputationAnalysis): number {
    // Confidence increases with more data
    const dataPoints = analysis.transactionHistory.length;
    const baseConfidence = Math.min(dataPoints / 20, 1.0);
    
    // Adjust based on flag consistency
    const flagConsistency = analysis.flags.length > 0 ? 0.8 : 0.5;
    
    return Math.min(baseConfidence * flagConsistency, 1.0);
  }

  // Network analysis methods
  private updateNetworkGraph(userId: string, transaction: TransactionRecord): void {
    // Update user node
    let userNode = this.networkGraph.get(userId);
    if (!userNode) {
      userNode = {
        address: userId,
        reputation: 0,
        connections: [],
        transactionCount: 0,
        avgTransactionValue: 0,
        lastActivity: new Date()
      };
    }

    userNode.transactionCount++;
    userNode.lastActivity = new Date();
    userNode.connections.push(transaction.counterparty);

    // Update counterparty node
    let counterpartyNode = this.networkGraph.get(transaction.counterparty);
    if (!counterpartyNode) {
      counterpartyNode = {
        address: transaction.counterparty,
        reputation: 0,
        connections: [],
        transactionCount: 0,
        avgTransactionValue: 0,
        lastActivity: new Date()
      };
    }

    counterpartyNode.connections.push(userId);
    this.networkGraph.set(transaction.counterparty, counterpartyNode);
    this.networkGraph.set(userId, userNode);
  }

  private detectCollusionPatterns(userId: string): number {
    // Simplified collusion detection
    const userNode = this.networkGraph.get(userId);
    if (!userNode) return 0;

    // Check for circular patterns
    const circularRisk = this.detectCircularPatterns(userId);
    
    // Check for hub patterns
    const hubRisk = userNode.connections.length > 10 ? 0.8 : 0;
    
    // Check for frequent trading with same users
    const frequentTradingRisk = this.detectFrequentTrading(userId);

    return Math.max(circularRisk, hubRisk, frequentTradingRisk);
  }

  private detectCircularPatterns(userId: string): number {
    // Simplified circular pattern detection
    // In practice, you'd use graph algorithms like Tarjan's algorithm
    // Note! Tarjan's algorithm is better than Bellman-ford in a directed graph for
    // finding strongly connected components. Especially for large graphs,
    // with each point reachable from every other point, Bellman-ford is O(n^3)
    // Tarjan's algorithm is O(n + m), as Tarjan's is a DFS, 
    // and Bellman-ford is O(n^2) loop traversal.
    return 0; // Placeholder
  }

  private detectFrequentTrading(userId: string): number {
    const userNode = this.networkGraph.get(userId);
    if (!userNode) return 0;

    // Count transactions with same users
    const connectionCounts = new Map<string, number>();
    for (const connection of userNode.connections) {
      connectionCounts.set(connection, (connectionCounts.get(connection) || 0) + 1);
    }

    const maxConnections = Math.max(...connectionCounts.values());
    return maxConnections > 5 ? 0.7 : 0;
  }

  private calculateNetworkCentrality(userId: string): number {
    const userNode = this.networkGraph.get(userId);
    if (!userNode) return 0;

    return userNode.connections.length / Math.max(this.networkGraph.size, 1);
  }

  private getConnectionCount(userId: string): number {
    const userNode = this.networkGraph.get(userId);
    return userNode ? userNode.connections.length : 0;
  }

  // Utility methods
  private calculateTransactionFrequencies(history: TransactionRecord[]): any {
    if (history.length < 2) return { avgFrequency: 0 };

    const intervals: number[] = [];
    for (let i = 1; i < history.length; i++) {
      const interval = history[i].timestamp.getTime() - history[i-1].timestamp.getTime();
      intervals.push(interval / (1000 * 60 * 60 * 24)); // Convert to days
    }

    const avgFrequency = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    return { avgFrequency };
  }

  private calculateReputationGrowth(history: number[]): any {
    if (history.length < 2) return { rate: 0 };

    const recent = history.slice(-5);
    const older = history.slice(0, 5);
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    
    return { rate: recentAvg - olderAvg };
  }

  private calculateTransactionVariance(history: TransactionRecord[]): number {
    if (history.length < 2) return 0;

    const values = history.map(tx => tx.shippingCost + tx.additionalProtection);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    
    return Math.sqrt(variance);
  }

  private analyzeTimePatterns(history: TransactionRecord[]): any {
    if (history.length < 5) return { regularity: 0 };

    // Simple regularity analysis
    const intervals: number[] = [];
    for (let i = 1; i < history.length; i++) {
      const interval = history[i].timestamp.getTime() - history[i-1].timestamp.getTime();
      intervals.push(interval);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((sum, val) => sum + Math.pow(val - avgInterval, 2), 0) / intervals.length;
    
    // Lower variance = more regular
    const regularity = 1 / (1 + variance / (avgInterval * avgInterval));
    
    return { regularity };
  }

  private calculateNetworkConnectivity(userId: string): number {
    const userNode = this.networkGraph.get(userId);
    if (!userNode) return 0;

    return userNode.connections.length / 10; // Normalize to 0-1
  }

  // Public methods for monitoring
  public getHighRiskUsers(): ReputationAnalysis[] {
    return Array.from(this.reputationAnalyses.values())
      .filter(analysis => analysis.isFlagged && analysis.confidence > this.MIN_CONFIDENCE)
      .sort((a, b) => b.riskScore - a.riskScore);
  }

  public getCollusionRings(): CollusionRing[] {
    return this.collusionRings;
  }

  public getNetworkStatistics(): any {
    return {
      totalUsers: this.networkGraph.size,
      totalAnalyses: this.reputationAnalyses.size,
      highRiskUsers: this.getHighRiskUsers().length,
      collusionRings: this.collusionRings.length,
      behavioralClusters: this.behavioralClusters.length
    };
  }

  public exportAnalysis(userId: string): ReputationAnalysis | null {
    return this.reputationAnalyses.get(userId) || null;
  }

  // Reset method for testing
  public reset(): void {
    this.reputationAnalyses.clear();
    this.networkGraph.clear();
    this.collusionRings = [];
    this.kalmanFilters.clear();
    this.behavioralClusters = [];
    console.log('🔄 Buffing Detection Service reset');
  }
}

// Export singleton instance
export const buffingDetectionService = new BuffingDetectionService(); 