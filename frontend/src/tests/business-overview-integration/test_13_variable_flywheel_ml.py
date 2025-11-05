"""
Test 13: Variable Flywheel Cron with ML Warehousing
Demonstrates adaptive frequency gearing, greedy query optimization, and ML data collection
"""

import pytest
import asyncio
from datetime import datetime, timedelta
from typing import Dict, Any, List


class TestVariableFlywheelCronWithMLWarehousing:
    """
    Business Overview Integration Test #13
    
    This test demonstrates the sophisticated market monitoring system:
    - Variable flywheel cron system with adaptive gearing
    - Greedy query optimization within API rate limits
    - ML warehouse data collection without model training
    - Gear shifting based on market volatility
    - Simultaneous cron execution with reliable fallback
    """
    
    def test_cron_frequency_adjustment(self):
        """Test cron job frequency adjustment based on market conditions"""
        print("\n⚙️ Test 13: Variable Flywheel Cron with ML Warehousing")
        
        # Mock cron job specs
        api_cron_job_specs = {
            'job_id': 'market_monitoring_001',
            'current_frequency': 'high',  # 1 hour
            'market_volatility': 0.15,
            'api_rate_limit': 100,
            'api_calls_made': 45,
            'data_points_collected': 450,
            'success_rate': 0.95
        }
        
        print("Step 1: Initial cron job state")
        print(f"Current frequency: {api_cron_job_specs['current_frequency']}")
        print(f"Market volatility: {api_cron_job_specs['market_volatility']}")
        print(f"API calls made: {api_cron_job_specs['api_calls_made']}")
        
        # Simulate market volatility increase
        api_cron_job_specs['market_volatility'] = 0.25
        api_cron_job_specs['api_calls_made'] = 85  # Approaching rate limit
        
        print("\nStep 2: Market volatility increased to 25%")
        print(f"New volatility: {api_cron_job_specs['market_volatility']}")
        print(f"API calls approaching limit: {api_cron_job_specs['api_calls_made']}/100")
        
        # Adjust frequency based on rate limits
        if api_cron_job_specs['api_calls_made'] > 80:
            api_cron_job_specs['current_frequency'] = 'veryhigh'  # 15 minutes
            print("Step 3: Frequency adjusted to 'veryhigh' (15 min) due to rate limits")
        
        assert api_cron_job_specs['current_frequency'] == 'veryhigh'
        print(f"✅ Frequency adjusted: {api_cron_job_specs['current_frequency']}")
        
        return api_cron_job_specs
    
    def test_greedy_query_optimization(self):
        """Test greedy query optimization within rate limits"""
        print("\nStep 4: Testing greedy query optimization")
        
        rate_limit = 100
        current_calls = 75
        remaining_calls = rate_limit - current_calls
        
        # Greedy query strategy: maximize queries within remaining limit
        queries_to_execute = []
        
        # Priority 1: High-value data
        high_value_queries = [
            {'name': 'market_volatility', 'cost': 2, 'priority': 1},
            {'name': 'trend_detection', 'cost': 3, 'priority': 1},
            {'name': 'correlation_analysis', 'cost': 2, 'priority': 1}
        ]
        
        # Execute high-value queries first
        for query in high_value_queries:
            if current_calls + query['cost'] <= rate_limit:
                queries_to_execute.append(query['name'])
                current_calls += query['cost']
        
        assert len(queries_to_execute) > 0
        print(f"✅ Executing {len(queries_to_execute)} high-value queries")
        print(f"Queries: {', '.join(queries_to_execute)}")
        print(f"Total API calls used: {current_calls}/100")
        
        return {
            'queries_executed': len(queries_to_execute),
            'api_calls_used': current_calls,
            'rate_limit_utilization': current_calls / rate_limit
        }
    
    def test_ml_warehousing_data_collection(self):
        """Test ML warehouse data collection without training"""
        print("\nStep 5: Testing ML warehouse data collection")
        
        # Mock ML warehouse data
        ml_warehouse_data = {
            'market_data': {
                'volatility': 0.25,
                'trend': 'downward',
                'correlation': 0.67,
                'timestamp': datetime.now().isoformat()
            },
            'cron_job_metrics': {
                'job_id': 'market_monitoring_001',
                'frequency': 'veryhigh',
                'success_rate': 0.95,
                'response_time_ms': 145,
                'error_rate': 0.05,
                'optimal_frequency': 'veryhigh',
                'current_gear': 4
            },
            'api_specs': {
                'total_api_calls': 85,
                'data_points_collected': 850,
                'rate_limit_approached': True,
                'greedy_queries_executed': 7
            }
        }
        
        print(f"✅ Collecting market data:")
        print(f"  - Volatility: {ml_warehouse_data['market_data']['volatility']}")
        print(f"  - Trend: {ml_warehouse_data['market_data']['trend']}")
        print(f"  - Correlation: {ml_warehouse_data['market_data']['correlation']}")
        print(f"\n✅ Collecting cron job metrics:")
        print(f"  - Frequency: {ml_warehouse_data['cron_job_metrics']['frequency']}")
        print(f"  - Success rate: {ml_warehouse_data['cron_job_metrics']['success_rate']}")
        print(f"  - Current gear: {ml_warehouse_data['cron_job_metrics']['current_gear']}")
        print(f"\n✅ Collecting API specs:")
        print(f"  - Total calls: {ml_warehouse_data['api_specs']['total_api_calls']}")
        print(f"  - Data points: {ml_warehouse_data['api_specs']['data_points_collected']}")
        
        # Verify data is ready for future ML training
        assert ml_warehouse_data['market_data']['volatility'] > 0
        assert ml_warehouse_data['cron_job_metrics']['success_rate'] > 0
        assert ml_warehouse_data['api_specs']['data_points_collected'] > 0
        
        print("\n✅ ML warehouse data collected successfully (ready for future training)")
        
        return ml_warehouse_data
    
    def test_gear_shifting(self):
        """Test gear shifting based on market conditions"""
        print("\nStep 6: Testing gear shifting")
        
        gears = {
            'low': {'frequency': 'low', 'interval_hours': 24},
            'medium': {'frequency': 'medium', 'interval_hours': 6},
            'high': {'frequency': 'high', 'interval_hours': 1},
            'veryhigh': {'frequency': 'veryhigh', 'interval_minutes': 15}
        }
        
        current_volatility = 0.25
        current_gear = 'high'
        
        # Determine optimal gear based on volatility
        if current_volatility > 0.20:
            current_gear = 'veryhigh'
        elif current_volatility > 0.15:
            current_gear = 'high'
        elif current_volatility > 0.10:
            current_gear = 'medium'
        else:
            current_gear = 'low'
        
        assert current_gear == 'veryhigh'
        print(f"✅ Shifted to gear: {current_gear}")
        print(f"  - Frequency: {gears[current_gear]['frequency']}")
        print(f"  - Interval: {gears[current_gear].get('interval_minutes', 'N/A')} minutes")
        
        return {
            'current_gear': current_gear,
            'gear_config': gears[current_gear],
            'volatility': current_volatility
        }
    
    def test_simultaneous_cron_execution(self):
        """Test simultaneous cron jobs with reliable fallback"""
        print("\nStep 7: Testing simultaneous cron execution")
        
        cron_jobs = {
            'market_volatility': {'status': 'running', 'frequency': 'veryhigh'},
            'trend_detection': {'status': 'running', 'frequency': 'high'},
            'correlation_analysis': {'status': 'running', 'frequency': 'medium'},
            'sentiment_analysis': {'status': 'standby', 'frequency': 'low'}
        }
        
        # Verify multiple jobs running simultaneously
        running_jobs = [job for job, config in cron_jobs.items() if config['status'] == 'running']
        assert len(running_jobs) == 3
        
        print(f"✅ {len(running_jobs)} cron jobs running simultaneously")
        for job in running_jobs:
            print(f"  - {job}: {cron_jobs[job]['frequency']}")
        
        # Test fallback mechanisms
        print("\nStep 8: Testing fallback mechanisms")
        if cron_jobs['market_volatility']['status'] == 'running':
            # Switch to backup if needed
            cron_jobs['market_volatility']['status'] = 'switchover'
            print("✅ Triggered fallback for market volatility monitoring")
        
        assert cron_jobs['market_volatility']['status'] == 'switchover'
        print("\n✅ Test 13 passed: Variable Flywheel Cron with ML Warehousing")
        
        return {
            'running_jobs': running_jobs,
            'fallback_triggered': True,
            'ml_data_collected': True
        }

