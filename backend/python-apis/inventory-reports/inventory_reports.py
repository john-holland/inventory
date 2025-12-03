"""
Inventory Document Reports System
Generates audit-ready inventory reports, item movement maps, and risk assessments
"""

import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
import json

@dataclass
class InventoryReportData:
    report_type: str
    include_prices: bool
    organize_by: str
    pii_level: str
    user_role: str

class InventoryReportGenerator:
    def __init__(self):
        self.pandas = pd
        self.numpy = np
        print("📦 Inventory Report Generator initialized")
    
    def generate_inventory_report(
        self, 
        include_prices: bool = True, 
        organize_by: str = "category", 
        pii_level: str = "full",
        user_role: str = "employee"
    ) -> Dict[str, Any]:
        """
        Generate audit-ready inventory reports with PII controls
        """
        # Simulate inventory data - in production, this would come from database
        inventory_data = self._get_inventory_data()
        
        # Convert to pandas DataFrame for analysis
        df = pd.DataFrame(inventory_data)
        
        # Apply PII controls based on user role
        if pii_level == "none" or user_role == "customer":
            # Remove sensitive information
            df = df.drop(columns=['owner_address', 'owner_phone'], errors='ignore')
        elif pii_level == "partial" or user_role == "csr":
            # Generalize addresses
            df['owner_address'] = df['owner_address'].apply(lambda x: self._generalize_address(x))
        
        # Remove prices if not included
        if not include_prices:
            df = df.drop(columns=['price', 'value'], errors='ignore')
        
        # Organize data
        if organize_by == "category":
            organized_data = df.groupby('category').apply(lambda x: x.to_dict('records')).to_dict()
        elif organize_by == "size":
            organized_data = df.groupby('size').apply(lambda x: x.to_dict('records')).to_dict()
        elif organize_by == "location":
            organized_data = df.groupby('location').apply(lambda x: x.to_dict('records')).to_dict()
        else:
            organized_data = {'all_items': df.to_dict('records')}
        
        # Calculate summary statistics
        total_items = len(df)
        total_value = df['value'].sum() if 'value' in df.columns else 0
        
        inventory_report = {
            'report_type': 'Inventory_Report',
            'generated_at': datetime.now().isoformat(),
            'include_prices': include_prices,
            'organize_by': organize_by,
            'pii_level': pii_level,
            'user_role': user_role,
            'total_items': int(total_items),
            'total_value': float(total_value) if include_prices else None,
            'organized_data': organized_data,
            'summary': {
                'categories': df['category'].nunique() if 'category' in df.columns else 0,
                'locations': df['location'].nunique() if 'location' in df.columns else 0,
                'average_value': float(df['value'].mean()) if 'value' in df.columns and include_prices else None
            }
        }
        
        print(f"📊 Generated inventory report with {total_items} items, organized by {organize_by}")
        return inventory_report
    
    def generate_item_movement_map(self, item_id: str) -> Dict[str, Any]:
        """
        Generate "Where's George" style item movement tracking
        """
        # Simulate item movement history
        movement_history = self._get_item_movement_history(item_id)
        
        # Convert to DataFrame for analysis
        df = pd.DataFrame(movement_history)
        
        # Calculate movement statistics
        total_movements = len(df)
        unique_locations = df['location'].nunique()
        total_distance = df['distance_km'].sum() if 'distance_km' in df.columns else 0
        
        # Create movement path
        movement_path = []
        for _, row in df.iterrows():
            movement_path.append({
                'timestamp': row['timestamp'],
                'location': row['location'],
                'latitude': row.get('latitude'),
                'longitude': row.get('longitude'),
                'event_type': row['event_type'],
                'user': row.get('user', 'Unknown')
            })
        
        item_movement_map = {
            'report_type': 'Item_Movement_Map',
            'item_id': item_id,
            'generated_at': datetime.now().isoformat(),
            'total_movements': int(total_movements),
            'unique_locations': int(unique_locations),
            'total_distance_km': float(total_distance),
            'movement_path': movement_path,
            'statistics': {
                'average_time_per_location': self._calculate_avg_time_per_location(df),
                'most_visited_location': df['location'].mode()[0] if not df.empty else None,
                'current_location': movement_path[-1]['location'] if movement_path else None
            }
        }
        
        print(f"🗺️ Generated item movement map for {item_id}: {total_movements} movements across {unique_locations} locations")
        return item_movement_map
    
    def generate_investment_hold_summary(self) -> Dict[str, Any]:
        """
        Generate summary of investment holds across all items
        """
        # Simulate investment hold data
        hold_data = self._get_investment_hold_data()
        
        # Convert to DataFrame
        df = pd.DataFrame(hold_data)
        
        # Calculate statistics using numpy
        total_shipping_holds = np.sum(df['shipping_hold'].values)
        total_additional_holds = np.sum(df['additional_hold'].values)
        total_insurance_holds = np.sum(df['insurance_hold'].values)
        
        # Calculate investable vs non-investable
        investable_amount = total_additional_holds + total_insurance_holds
        non_investable_amount = total_shipping_holds
        
        investment_hold_summary = {
            'report_type': 'Investment_Hold_Summary',
            'generated_at': datetime.now().isoformat(),
            'total_items_with_holds': len(df),
            'total_shipping_holds': float(total_shipping_holds),
            'total_additional_holds': float(total_additional_holds),
            'total_insurance_holds': float(total_insurance_holds),
            'investable_amount': float(investable_amount),
            'non_investable_amount': float(non_investable_amount),
            'breakdown_by_item': df.to_dict('records')
        }
        
        print(f"💰 Generated investment hold summary: ${investable_amount:.2f} investable, ${non_investable_amount:.2f} non-investable")
        return investment_hold_summary
    
    def generate_shipping_cost_analysis(self) -> Dict[str, Any]:
        """
        Generate shipping cost analysis report
        """
        # Simulate shipping data
        shipping_data = self._get_shipping_data()
        
        # Convert to DataFrame
        df = pd.DataFrame(shipping_data)
        
        # Calculate statistics
        total_shipping_cost = df['cost'].sum()
        average_cost = df['cost'].mean()
        optimization_savings = df['savings'].sum() if 'savings' in df.columns else 0
        
        # Group by carrier
        carrier_analysis = df.groupby('carrier').agg({
            'cost': ['sum', 'mean', 'count']
        }).to_dict()
        
        shipping_cost_analysis = {
            'report_type': 'Shipping_Cost_Analysis',
            'generated_at': datetime.now().isoformat(),
            'total_shipments': len(df),
            'total_shipping_cost': float(total_shipping_cost),
            'average_cost_per_shipment': float(average_cost),
            'optimization_savings': float(optimization_savings),
            'carrier_analysis': carrier_analysis,
            'cost_trends': {
                'highest_cost': float(df['cost'].max()),
                'lowest_cost': float(df['cost'].min()),
                'median_cost': float(df['cost'].median())
            }
        }
        
        print(f"📮 Generated shipping cost analysis: {len(df)} shipments, ${total_shipping_cost:.2f} total cost")
        return shipping_cost_analysis
    
    def generate_risk_assessment_report(self) -> Dict[str, Any]:
        """
        Generate risk assessment report for investments
        """
        # Simulate risk data
        risk_data = self._get_risk_data()
        
        # Convert to DataFrame
        df = pd.DataFrame(risk_data)
        
        # Calculate risk scores using numpy
        risk_scores = df['risk_score'].values
        avg_risk = np.mean(risk_scores)
        std_risk = np.std(risk_scores)
        
        # Categorize by risk level
        high_risk = len(df[df['risk_score'] > 0.7])
        medium_risk = len(df[(df['risk_score'] >= 0.3) & (df['risk_score'] <= 0.7)])
        low_risk = len(df[df['risk_score'] < 0.3])
        
        risk_assessment_report = {
            'report_type': 'Risk_Assessment_Report',
            'generated_at': datetime.now().isoformat(),
            'total_investments': len(df),
            'average_risk_score': float(avg_risk),
            'risk_std_deviation': float(std_risk),
            'risk_distribution': {
                'high_risk': int(high_risk),
                'medium_risk': int(medium_risk),
                'low_risk': int(low_risk)
            },
            'high_risk_items': df[df['risk_score'] > 0.7].to_dict('records'),
            'recommendations': self._generate_risk_recommendations(avg_risk, high_risk)
        }
        
        print(f"⚠️ Generated risk assessment report: {high_risk} high-risk, {medium_risk} medium-risk, {low_risk} low-risk investments")
        return risk_assessment_report
    
    def _get_inventory_data(self) -> List[Dict[str, Any]]:
        """Mock inventory data"""
        return [
            {'item_id': 'item_001', 'name': 'Camera', 'category': 'Electronics', 'size': 'Medium', 'location': 'Warehouse A', 'value': 500, 'price': 50, 'owner_address': '123 Main St, San Francisco, CA', 'owner_phone': '555-0101'},
            {'item_id': 'item_002', 'name': 'Tent', 'category': 'Outdoor', 'size': 'Large', 'location': 'Warehouse B', 'value': 200, 'price': 20, 'owner_address': '456 Oak Ave, Oakland, CA', 'owner_phone': '555-0102'},
            {'item_id': 'item_003', 'name': 'Laptop', 'category': 'Electronics', 'size': 'Small', 'location': 'Warehouse A', 'value': 1000, 'price': 100, 'owner_address': '789 Pine Rd, Berkeley, CA', 'owner_phone': '555-0103'},
        ]
    
    def _get_item_movement_history(self, item_id: str) -> List[Dict[str, Any]]:
        """Mock item movement history"""
        return [
            {'timestamp': '2024-01-01T10:00:00', 'location': 'San Francisco, CA', 'latitude': 37.7749, 'longitude': -122.4194, 'event_type': 'created', 'distance_km': 0},
            {'timestamp': '2024-01-05T14:30:00', 'location': 'Oakland, CA', 'latitude': 37.8044, 'longitude': -122.2712, 'event_type': 'borrowed', 'distance_km': 15},
            {'timestamp': '2024-01-10T09:15:00', 'location': 'Berkeley, CA', 'latitude': 37.8715, 'longitude': -122.2730, 'event_type': 'transferred', 'distance_km': 8},
            {'timestamp': '2024-01-15T16:45:00', 'location': 'San Francisco, CA', 'latitude': 37.7749, 'longitude': -122.4194, 'event_type': 'returned', 'distance_km': 15},
        ]
    
    def _get_investment_hold_data(self) -> List[Dict[str, Any]]:
        """Mock investment hold data"""
        return [
            {'item_id': 'item_001', 'shipping_hold': 100, 'additional_hold': 50, 'insurance_hold': 25},
            {'item_id': 'item_002', 'shipping_hold': 80, 'additional_hold': 40, 'insurance_hold': 20},
            {'item_id': 'item_003', 'shipping_hold': 120, 'additional_hold': 60, 'insurance_hold': 30},
        ]
    
    def _get_shipping_data(self) -> List[Dict[str, Any]]:
        """Mock shipping data"""
        return [
            {'shipment_id': 'ship_001', 'carrier': 'USPS', 'cost': 15.50, 'savings': 2.00},
            {'shipment_id': 'ship_002', 'carrier': 'UPS', 'cost': 20.00, 'savings': 1.50},
            {'shipment_id': 'ship_003', 'carrier': 'FedEx', 'cost': 18.75, 'savings': 3.00},
        ]
    
    def _get_risk_data(self) -> List[Dict[str, Any]]:
        """Mock risk data"""
        return [
            {'investment_id': 'inv_001', 'item_id': 'item_001', 'risk_score': 0.25, 'risk_level': 'low'},
            {'investment_id': 'inv_002', 'item_id': 'item_002', 'risk_score': 0.75, 'risk_level': 'high'},
            {'investment_id': 'inv_003', 'item_id': 'item_003', 'risk_score': 0.50, 'risk_level': 'medium'},
        ]
    
    def _generalize_address(self, address: str) -> str:
        """Generalize address for PII protection"""
        # Extract city and state only
        parts = address.split(',')
        if len(parts) >= 2:
            return f"{parts[-2].strip()}, {parts[-1].strip()}"
        return "Location Hidden"
    
    def _calculate_avg_time_per_location(self, df: pd.DataFrame) -> float:
        """Calculate average time spent per location"""
        if len(df) < 2:
            return 0.0
        
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df = df.sort_values('timestamp')
        time_diffs = df['timestamp'].diff().dt.total_seconds() / 3600  # Convert to hours
        return float(time_diffs.mean()) if not time_diffs.isna().all() else 0.0
    
    def _generate_risk_recommendations(self, avg_risk: float, high_risk_count: int) -> List[str]:
        """Generate risk recommendations"""
        recommendations = []
        
        if avg_risk > 0.6:
            recommendations.append("Overall portfolio risk is high. Consider diversifying investments.")
        
        if high_risk_count > 5:
            recommendations.append(f"{high_risk_count} high-risk investments detected. Review and consider risk mitigation strategies.")
        
        if avg_risk < 0.3:
            recommendations.append("Portfolio risk is low. Consider opportunities for higher returns with acceptable risk.")
        
        return recommendations

# Export the main class
__all__ = ['InventoryReportGenerator', 'InventoryReportData']

