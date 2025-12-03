"""
Variable Flywheel Cron System
Adaptive frequency cron jobs with bike gear system for market monitoring
"""

import asyncio
import aiohttp
from datetime import datetime, timedelta
from enum import Enum
from dataclasses import dataclass
from typing import Dict, List, Optional, Any
import numpy as np
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

from ml_warehouse import MLWarehouse, CronJobSpec

class GearLevel(Enum):
    LOW = "low"           # 1 hour intervals, 200 queries/batch
    MEDIUM = "medium"     # 5 minute intervals, 100 queries/batch  
    HIGH = "high"         # 1 minute intervals, 50 queries/batch
    EMERGENCY = "emergency"  # 30 second intervals, 25 queries/batch

@dataclass
class RateLimitStatus:
    remaining_quota: int
    reset_time: datetime
    current_usage: int
    limit: int

@dataclass
class GearConfig:
    frequency: int  # seconds
    batch_size: int
    query_timeout: int
    parallel_workers: int

class VariableFlywheelCron:
    def __init__(self, name: str, base_schedule: str, ml_warehouse: Optional[MLWarehouse] = None):
        self.name = name
        self.base_schedule = base_schedule
        self.current_gear = GearLevel.MEDIUM
        self.rate_limit_status = RateLimitStatus(1000, datetime.now(), 0, 1000)
        self.volatility_threshold = 0.15
        self.market_data_cache = {}
        self.ml_warehouse = ml_warehouse or MLWarehouse()
        self.scheduler = AsyncIOScheduler()
        
        # Gear configurations
        self.gear_configs = {
            GearLevel.LOW: GearConfig(
                frequency=3600,      # 1 hour
                batch_size=200,      # Large batches
                query_timeout=30,    # 30 second timeout
                parallel_workers=4    # Fewer workers
            ),
            GearLevel.MEDIUM: GearConfig(
                frequency=300,       # 5 minutes
                batch_size=100,      # Medium batches
                query_timeout=20,    # 20 second timeout
                parallel_workers=8    # More workers
            ),
            GearLevel.HIGH: GearConfig(
                frequency=60,        # 1 minute
                batch_size=50,       # Small batches
                query_timeout=10,    # 10 second timeout
                parallel_workers=16   # Many workers
            ),
            GearLevel.EMERGENCY: GearConfig(
                frequency=30,        # 30 seconds
                batch_size=25,       # Micro batches
                query_timeout=5,     # 5 second timeout
                parallel_workers=32   # Maximum workers
            )
        }
        
        print(f"🔄 Variable Flywheel Cron '{name}' initialized")
    
    async def shift_gear(self, new_gear: str):
        """Shift to a new gear based on market conditions"""
        gear = GearLevel(new_gear)
        old_gear = self.current_gear
        self.current_gear = gear
        config = self.gear_configs[gear]
        
        print(f"🔄 Shifting from {old_gear.value} to {gear.value} gear: {config.frequency}s intervals, {config.batch_size} queries/batch")
        
        # Update scheduler
        await self.update_cron_schedule(config.frequency)
        
        # Notify investment robots of gear change
        await self.notify_investment_robots(gear)
    
    async def update_cron_schedule(self, frequency: int):
        """Update cron schedule based on new frequency"""
        # Remove existing jobs
        self.scheduler.remove_all_jobs()
        
        # Add new job with updated frequency
        if frequency < 60:
            # Use interval trigger for sub-minute frequencies
            self.scheduler.add_job(
                self.run_cron_cycle,
                trigger=IntervalTrigger(seconds=frequency),
                id=f"{self.name}_job"
            )
        else:
            # Use interval trigger for minute-based frequencies
            self.scheduler.add_job(
                self.run_cron_cycle,
                trigger=IntervalTrigger(seconds=frequency),
                id=f"{self.name}_job"
            )
        
        print(f"⏰ Updated cron schedule: {frequency}s frequency")
    
    async def greedy_market_data_fetch(self) -> Dict:
        """Greedy query optimization to maximize data collection"""
        config = self.gear_configs[self.current_gear]
        
        # Check rate limits before proceeding
        if self.rate_limit_status.remaining_quota < config.batch_size:
            print(f"⚠️ Rate limit low ({self.rate_limit_status.remaining_quota}), shifting to lower gear")
            await self.shift_gear("low")
            return {}
        
        # Batch multiple API calls
        tasks = []
        for i in range(config.batch_size):
            task = self.fetch_market_data_batch(i)
            tasks.append(task)
        
        # Execute with timeout
        try:
            results = await asyncio.wait_for(
                asyncio.gather(*tasks, return_exceptions=True),
                timeout=config.query_timeout
            )
            
            # Process results and update cache
            market_data = self.process_market_data(results)
            self.market_data_cache.update(market_data)
            
            # Update rate limit status
            self.rate_limit_status.current_usage += config.batch_size
            self.rate_limit_status.remaining_quota -= config.batch_size
            
            return market_data
            
        except asyncio.TimeoutError:
            print(f"⏰ Timeout in {self.current_gear.value} gear, reducing batch size")
            await self.shift_gear("low")
            return {}
    
    async def fetch_market_data_batch(self, batch_id: int) -> Dict:
        """Fetch a batch of market data (mock implementation)"""
        # Simulate API call delay
        await asyncio.sleep(0.1)
        
        # Return mock market data
        return {
            f"asset_{batch_id}": 100 + np.random.uniform(-10, 10)
        }
    
    def process_market_data(self, results: List) -> Dict:
        """Process market data results"""
        market_data = {}
        for result in results:
            if isinstance(result, dict):
                market_data.update(result)
        return market_data
    
    async def detect_market_downturn(self) -> bool:
        """Detect market downturn and adjust gear accordingly"""
        market_data = await self.greedy_market_data_fetch()
        
        if not market_data:
            return False
        
        # Calculate volatility
        volatility = self.calculate_volatility(market_data)
        
        # Determine appropriate gear based on volatility
        if volatility > 0.25:  # Extreme volatility
            if self.current_gear != GearLevel.EMERGENCY:
                await self.shift_gear("emergency")
                await self.activate_emergency_protocols()
        elif volatility > 0.15:  # High volatility
            if self.current_gear != GearLevel.HIGH:
                await self.shift_gear("high")
        elif volatility > 0.05:  # Normal volatility
            if self.current_gear != GearLevel.MEDIUM:
                await self.shift_gear("medium")
        else:  # Low volatility
            if self.current_gear != GearLevel.LOW:
                await self.shift_gear("low")
        
        # Store data in ML warehouse
        await self.store_ml_data(volatility)
        
        return volatility > self.volatility_threshold
    
    def calculate_volatility(self, market_data: Dict) -> float:
        """Calculate market volatility using numpy"""
        if not market_data:
            return 0.0
        
        prices = list(market_data.values())
        if len(prices) < 2:
            return 0.0
        
        returns = np.diff(prices) / prices[:-1]
        volatility = np.std(returns) * np.sqrt(252)  # Annualized volatility
        
        return float(volatility)
    
    async def activate_emergency_protocols(self):
        """Activate emergency protocols during market stress"""
        print("🚨 EMERGENCY PROTOCOLS ACTIVATED")
        
        # Get all active investment robots (mock implementation)
        robots = await self.get_active_investment_robots()
        
        # Activate emergency mode for all robots
        for robot in robots:
            print(f"  🤖 Activating emergency mode for robot {robot['id']}")
            # In production, this would call actual robot APIs
        
        # Send alerts (mock implementation)
        await self.send_emergency_alerts(robots)
    
    async def notify_investment_robots(self, gear: GearLevel):
        """Notify investment robots of gear changes"""
        robots = await self.get_active_investment_robots()
        
        for robot in robots:
            print(f"  📡 Notifying robot {robot['id']} of gear change to {gear.value}")
            # In production, this would call actual robot APIs
    
    async def get_active_investment_robots(self) -> List[Dict]:
        """Get active investment robots (mock implementation)"""
        return [
            {'id': 'robot_001', 'status': 'active'},
            {'id': 'robot_002', 'status': 'active'},
        ]
    
    async def send_emergency_alerts(self, robots: List[Dict]):
        """Send emergency alerts (mock implementation)"""
        print(f"  📧 Sending emergency alerts to {len(robots)} robots")
    
    async def store_ml_data(self, volatility: float):
        """Store performance data in ML warehouse"""
        config = self.gear_configs[self.current_gear]
        
        # Calculate query success rate
        success_rate = 0.95 if self.rate_limit_status.remaining_quota > 100 else 0.75
        
        # Calculate error rate
        error_rate = 0.05 if self.rate_limit_status.remaining_quota > 100 else 0.25
        
        # Create cron job spec
        spec = CronJobSpec(
            timestamp=datetime.now(),
            market_volatility=volatility,
            rate_limit_remaining=self.rate_limit_status.remaining_quota,
            query_success_rate=success_rate,
            response_time_avg=config.query_timeout * 1000,  # Convert to ms
            error_rate=error_rate,
            optimal_frequency=self.current_gear.value,
            current_gear=self.current_gear.value,
            api_calls_made=config.batch_size,
            data_points_collected=len(self.market_data_cache)
        )
        
        # Store in ML warehouse
        self.ml_warehouse.store_cron_job_spec(spec)
    
    async def run_cron_cycle(self):
        """Run a single cron cycle"""
        start_time = datetime.now()
        
        try:
            # Detect market conditions
            is_downturn = await self.detect_market_downturn()
            
            # Fetch market data with greedy optimization
            market_data = await self.greedy_market_data_fetch()
            
            # Log execution
            duration = (datetime.now() - start_time).total_seconds()
            self.ml_warehouse.log_cron_execution(
                job_name=self.name,
                duration=duration,
                status='success',
                gear_level=self.current_gear.value
            )
            
            print(f"✅ Cron cycle completed in {duration:.2f}s, gear={self.current_gear.value}")
            
        except Exception as e:
            duration = (datetime.now() - start_time).total_seconds()
            self.ml_warehouse.log_cron_execution(
                job_name=self.name,
                duration=duration,
                status='failed',
                gear_level=self.current_gear.value,
                error_message=str(e)
            )
            print(f"❌ Cron cycle error: {e}")
    
    async def start(self):
        """Start the variable flywheel cron system"""
        print(f"🚀 Starting Variable Flywheel Cron '{self.name}'")
        
        # Initialize ML warehouse connection
        self.ml_warehouse.connect()
        
        # Set up initial schedule
        await self.update_cron_schedule(self.gear_configs[self.current_gear].frequency)
        
        # Start scheduler
        self.scheduler.start()
        
        print(f"✅ Variable Flywheel Cron '{self.name}' started in {self.current_gear.value} gear")
    
    async def stop(self):
        """Stop the variable flywheel cron system"""
        print(f"🛑 Stopping Variable Flywheel Cron '{self.name}'")
        
        # Stop scheduler
        self.scheduler.shutdown()
        
        # Disconnect ML warehouse
        self.ml_warehouse.disconnect()
        
        print(f"✅ Variable Flywheel Cron '{self.name}' stopped")

# Simultaneous cron execution with fallback
class VariableFlywheel:
    """
    Manages multiple cron jobs running simultaneously with fallback priority
    """
    def __init__(self, low: VariableFlywheelCron, medium: VariableFlywheelCron, 
                 high: VariableFlywheelCron, veryhigh: VariableFlywheelCron):
        self.crons = {
            'low': low,
            'medium': medium,
            'high': high,
            'veryhigh': veryhigh
        }
        self.active_cron = 'medium'  # Default to medium
        print("🎛️ Variable Flywheel initialized with 4 gear levels")
    
    async def start_all_simultaneously(self):
        """Start all cron jobs simultaneously"""
        print("🚀 Starting all cron jobs simultaneously...")
        
        tasks = []
        for name, cron in self.crons.items():
            tasks.append(cron.start())
        
        await asyncio.gather(*tasks)
        
        print("✅ All cron jobs started")
    
    async def get_active_cron_based_on_conditions(self) -> str:
        """Determine which cron should be active based on current conditions"""
        # This would analyze market conditions and return the appropriate cron
        # For now, return the medium cron as default
        return 'medium'
    
    async def shift_gear(self, gear_level: str):
        """Shift to a specific gear level"""
        if gear_level in self.crons:
            self.active_cron = gear_level
            print(f"🔄 Shifted to {gear_level} gear")
    
    async def stop_all(self):
        """Stop all cron jobs"""
        print("🛑 Stopping all cron jobs...")
        
        tasks = []
        for name, cron in self.crons.items():
            tasks.append(cron.stop())
        
        await asyncio.gather(*tasks)
        
        print("✅ All cron jobs stopped")

# Usage example
async def main():
    # Create ML warehouse
    ml_warehouse = MLWarehouse()
    
    # Create individual cron jobs for each gear level
    low_cron = VariableFlywheelCron("market_downturn_detection_low", "*/10 * * * *", ml_warehouse)
    medium_cron = VariableFlywheelCron("market_downturn_detection_medium", "*/5 * * * *", ml_warehouse)
    high_cron = VariableFlywheelCron("market_downturn_detection_high", "*/1 * * * *", ml_warehouse)
    veryhigh_cron = VariableFlywheelCron("market_downturn_detection_veryhigh", "*/5 * * * * *", ml_warehouse)
    
    # Create variable flywheel with all gears
    flywheel = VariableFlywheel(low_cron, medium_cron, high_cron, veryhigh_cron)
    
    # Start all cron jobs simultaneously
    await flywheel.start_all_simultaneously()
    
    # Run for a period of time
    print("Running for 60 seconds...")
    await asyncio.sleep(60)
    
    # Stop all cron jobs
    await flywheel.stop_all()

if __name__ == "__main__":
    asyncio.run(main())

# Export the main classes
__all__ = ['VariableFlywheelCron', 'VariableFlywheel', 'GearLevel', 'RateLimitStatus', 'GearConfig']

