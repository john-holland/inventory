"""
ML Warehouse for Cron Job Optimization
Collects and stores API cron job performance data for future ML optimization
"""

import psycopg2
from psycopg2.extras import RealDictCursor
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
import json

@dataclass
class CronJobSpec:
    timestamp: datetime
    market_volatility: float
    rate_limit_remaining: int
    query_success_rate: float
    response_time_avg: float
    error_rate: float
    optimal_frequency: str
    current_gear: str
    api_calls_made: int
    data_points_collected: int

class MLWarehouse:
    def __init__(self, db_config: Optional[Dict[str, str]] = None):
        """
        Initialize ML Warehouse with database configuration
        """
        self.db_config = db_config or {
            'host': 'localhost',
            'port': 5432,
            'database': 'inventory_db',
            'user': 'postgres',
            'password': 'postgres'
        }
        self.connection = None
        print("🤖 ML Warehouse initialized")
    
    def connect(self):
        """Connect to PostgreSQL database"""
        try:
            self.connection = psycopg2.connect(**self.db_config)
            print("✅ Connected to ML Warehouse database")
        except Exception as e:
            print(f"❌ Failed to connect to database: {e}")
            # For development, continue without database
            self.connection = None
    
    def disconnect(self):
        """Disconnect from database"""
        if self.connection:
            self.connection.close()
            print("🔌 Disconnected from ML Warehouse database")
    
    def store_cron_job_spec(self, spec: CronJobSpec) -> bool:
        """
        Store cron job specification data for ML training
        """
        if not self.connection:
            # Store in memory for development
            print(f"📊 Storing cron job spec (in-memory): gear={spec.current_gear}, volatility={spec.market_volatility:.4f}")
            return True
        
        try:
            cursor = self.connection.cursor()
            
            query = """
                INSERT INTO api_cron_job_specs (
                    timestamp, market_volatility, rate_limit_remaining,
                    query_success_rate, response_time_avg, error_rate,
                    optimal_frequency, current_gear, api_calls_made,
                    data_points_collected
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """
            
            cursor.execute(query, (
                spec.timestamp,
                spec.market_volatility,
                spec.rate_limit_remaining,
                spec.query_success_rate,
                spec.response_time_avg,
                spec.error_rate,
                spec.optimal_frequency,
                spec.current_gear,
                spec.api_calls_made,
                spec.data_points_collected
            ))
            
            self.connection.commit()
            cursor.close()
            
            print(f"✅ Stored cron job spec: gear={spec.current_gear}, volatility={spec.market_volatility:.4f}")
            return True
            
        except Exception as e:
            print(f"❌ Failed to store cron job spec: {e}")
            return False
    
    def collect_training_data(self, days: int = 30) -> pd.DataFrame:
        """
        Collect training data from the last N days
        """
        if not self.connection:
            # Return mock data for development
            return self._generate_mock_training_data(days)
        
        try:
            cursor = self.connection.cursor(cursor_factory=RealDictCursor)
            
            query = """
                SELECT 
                    timestamp,
                    market_volatility,
                    rate_limit_remaining,
                    query_success_rate,
                    response_time_avg,
                    error_rate,
                    optimal_frequency,
                    current_gear,
                    api_calls_made,
                    data_points_collected
                FROM api_cron_job_specs
                WHERE timestamp >= NOW() - INTERVAL '%s days'
                ORDER BY timestamp ASC
            """
            
            cursor.execute(query, (days,))
            rows = cursor.fetchall()
            cursor.close()
            
            df = pd.DataFrame(rows)
            print(f"📊 Collected {len(df)} training samples from last {days} days")
            return df
            
        except Exception as e:
            print(f"❌ Failed to collect training data: {e}")
            return pd.DataFrame()
    
    def engineer_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Engineer features for ML model training
        """
        if df.empty:
            return df
        
        # Add time-based features
        df['hour_of_day'] = pd.to_datetime(df['timestamp']).dt.hour
        df['day_of_week'] = pd.to_datetime(df['timestamp']).dt.dayofweek
        
        # Add rolling averages
        df['volatility_rolling_avg'] = df['market_volatility'].rolling(window=5, min_periods=1).mean()
        df['success_rate_rolling_avg'] = df['query_success_rate'].rolling(window=5, min_periods=1).mean()
        
        # Add rate limit pressure indicator
        df['rate_limit_pressure'] = 1 - (df['rate_limit_remaining'] / 1000)
        
        # Add performance score
        df['performance_score'] = (
            df['query_success_rate'] * 0.4 +
            (1 - df['error_rate']) * 0.3 +
            (1 - df['rate_limit_pressure']) * 0.3
        )
        
        print(f"✨ Engineered {len(df.columns)} features for ML training")
        return df
    
    def get_feature_statistics(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Calculate statistics for features
        """
        if df.empty:
            return {}
        
        stats = {
            'market_volatility': {
                'mean': float(df['market_volatility'].mean()),
                'std': float(df['market_volatility'].std()),
                'min': float(df['market_volatility'].min()),
                'max': float(df['market_volatility'].max())
            },
            'query_success_rate': {
                'mean': float(df['query_success_rate'].mean()),
                'std': float(df['query_success_rate'].std()),
                'min': float(df['query_success_rate'].min()),
                'max': float(df['query_success_rate'].max())
            },
            'response_time_avg': {
                'mean': float(df['response_time_avg'].mean()),
                'std': float(df['response_time_avg'].std()),
                'min': float(df['response_time_avg'].min()),
                'max': float(df['response_time_avg'].max())
            },
            'gear_distribution': df['current_gear'].value_counts().to_dict()
        }
        
        return stats
    
    def log_cron_execution(self, job_name: str, duration: float, status: str, gear_level: str, error_message: Optional[str] = None) -> bool:
        """
        Log cron job execution for monitoring
        """
        if not self.connection:
            print(f"📝 Logging cron execution (in-memory): {job_name} - {status} - {duration:.2f}s")
            return True
        
        try:
            cursor = self.connection.cursor()
            
            query = """
                INSERT INTO cron_job_execution_logs (
                    job_name, execution_time, duration_seconds,
                    status, gear_level, error_message
                ) VALUES (%s, NOW(), %s, %s, %s, %s)
            """
            
            cursor.execute(query, (job_name, duration, status, gear_level, error_message))
            self.connection.commit()
            cursor.close()
            
            return True
            
        except Exception as e:
            print(f"❌ Failed to log cron execution: {e}")
            return False
    
    def get_recent_executions(self, job_name: Optional[str] = None, hours: int = 24) -> pd.DataFrame:
        """
        Get recent cron job executions
        """
        if not self.connection:
            return self._generate_mock_execution_logs(hours)
        
        try:
            cursor = self.connection.cursor(cursor_factory=RealDictCursor)
            
            if job_name:
                query = """
                    SELECT * FROM cron_job_execution_logs
                    WHERE job_name = %s AND execution_time >= NOW() - INTERVAL '%s hours'
                    ORDER BY execution_time DESC
                """
                cursor.execute(query, (job_name, hours))
            else:
                query = """
                    SELECT * FROM cron_job_execution_logs
                    WHERE execution_time >= NOW() - INTERVAL '%s hours'
                    ORDER BY execution_time DESC
                """
                cursor.execute(query, (hours,))
            
            rows = cursor.fetchall()
            cursor.close()
            
            return pd.DataFrame(rows)
            
        except Exception as e:
            print(f"❌ Failed to get recent executions: {e}")
            return pd.DataFrame()
    
    def _generate_mock_training_data(self, days: int) -> pd.DataFrame:
        """Generate mock training data for development"""
        np.random.seed(42)
        n_samples = days * 24  # One sample per hour
        
        data = {
            'timestamp': pd.date_range(end=datetime.now(), periods=n_samples, freq='H'),
            'market_volatility': np.random.uniform(0.05, 0.30, n_samples),
            'rate_limit_remaining': np.random.randint(100, 1000, n_samples),
            'query_success_rate': np.random.uniform(0.85, 1.0, n_samples),
            'response_time_avg': np.random.uniform(50, 500, n_samples),
            'error_rate': np.random.uniform(0.0, 0.15, n_samples),
            'optimal_frequency': np.random.choice(['low', 'medium', 'high', 'veryhigh'], n_samples),
            'current_gear': np.random.choice(['low', 'medium', 'high', 'emergency'], n_samples),
            'api_calls_made': np.random.randint(50, 200, n_samples),
            'data_points_collected': np.random.randint(100, 1000, n_samples)
        }
        
        df = pd.DataFrame(data)
        print(f"🎲 Generated {len(df)} mock training samples")
        return df
    
    def _generate_mock_execution_logs(self, hours: int) -> pd.DataFrame:
        """Generate mock execution logs for development"""
        np.random.seed(42)
        n_samples = hours
        
        data = {
            'id': range(1, n_samples + 1),
            'job_name': ['market_monitoring'] * n_samples,
            'execution_time': pd.date_range(end=datetime.now(), periods=n_samples, freq='H'),
            'duration_seconds': np.random.uniform(1, 30, n_samples),
            'status': np.random.choice(['success', 'failed'], n_samples, p=[0.95, 0.05]),
            'gear_level': np.random.choice(['low', 'medium', 'high', 'emergency'], n_samples),
            'error_message': [None] * n_samples
        }
        
        df = pd.DataFrame(data)
        return df

# Export the main class
__all__ = ['MLWarehouse', 'CronJobSpec']

