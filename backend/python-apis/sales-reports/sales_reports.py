"""
Sales Reports & Analytics System
Generates sales reports with PII controls, transaction analysis, and revenue tracking
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
import json

@dataclass
class SalesReportData:
    report_type: str
    include_buyer_info: bool
    pii_level: str
    user_role: str
    date_range: Dict[str, str]

class SalesReportGenerator:
    def __init__(self):
        self.pandas = pd
        self.numpy = np
        print("💵 Sales Report Generator initialized")
    
    def generate_sales_report(
        self,
        include_buyer_info: bool = False,
        pii_level: str = "none",
        user_role: str = "customer",
        start_date: Optional[str] = None,
        end_date: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate sales reports with PII controls based on user role
        """
        # Get sales data
        sales_data = self._get_sales_data(start_date, end_date)
        
        # Convert to DataFrame
        df = pd.DataFrame(sales_data)
        
        # Apply PII controls based on user role
        if not include_buyer_info or user_role == "customer":
            # Remove all buyer information
            df = df.drop(columns=['buyer_name', 'buyer_email', 'buyer_address', 'buyer_phone'], errors='ignore')
        elif pii_level == "partial" or user_role == "csr":
            # Generalize buyer information
            if 'buyer_address' in df.columns:
                df['buyer_address'] = df['buyer_address'].apply(lambda x: self._generalize_address(x))
            if 'buyer_phone' in df.columns:
                df['buyer_phone'] = df['buyer_phone'].apply(lambda x: self._mask_phone(x))
        # For employee role with pii_level="full", keep all information
        
        # Calculate summary statistics
        total_sales = len(df)
        total_revenue = df['amount'].sum()
        average_sale = df['amount'].mean()
        
        # Group by category
        category_sales = df.groupby('category').agg({
            'amount': ['sum', 'count', 'mean']
        }).to_dict() if 'category' in df.columns else {}
        
        sales_report = {
            'report_type': 'Sales_Report',
            'generated_at': datetime.now().isoformat(),
            'include_buyer_info': include_buyer_info,
            'pii_level': pii_level,
            'user_role': user_role,
            'date_range': {
                'start': start_date or 'all_time',
                'end': end_date or datetime.now().strftime('%Y-%m-%d')
            },
            'summary': {
                'total_sales': int(total_sales),
                'total_revenue': float(total_revenue),
                'average_sale': float(average_sale)
            },
            'category_breakdown': category_sales,
            'sales_data': df.to_dict('records')
        }
        
        print(f"📊 Generated sales report: {total_sales} sales, ${total_revenue:.2f} revenue")
        return sales_report
    
    def generate_transaction_history_analysis(self, user_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Generate transaction history analysis
        """
        # Get transaction data
        transactions = self._get_transaction_data(user_id)
        
        # Convert to DataFrame
        df = pd.DataFrame(transactions)
        
        if df.empty:
            return {'report_type': 'Transaction_History', 'message': 'No transactions found'}
        
        # Calculate statistics
        total_transactions = len(df)
        total_volume = df['amount'].sum()
        
        # Transaction types breakdown
        type_breakdown = df.groupby('transaction_type').agg({
            'amount': ['sum', 'count']
        }).to_dict()
        
        # Time series analysis
        df['date'] = pd.to_datetime(df['timestamp']).dt.date
        daily_transactions = df.groupby('date').agg({
            'amount': 'sum',
            'transaction_id': 'count'
        }).to_dict()
        
        transaction_analysis = {
            'report_type': 'Transaction_History_Analysis',
            'generated_at': datetime.now().isoformat(),
            'user_id': user_id or 'all_users',
            'total_transactions': int(total_transactions),
            'total_volume': float(total_volume),
            'type_breakdown': type_breakdown,
            'daily_transactions': daily_transactions,
            'statistics': {
                'average_transaction': float(df['amount'].mean()),
                'median_transaction': float(df['amount'].median()),
                'largest_transaction': float(df['amount'].max()),
                'smallest_transaction': float(df['amount'].min())
            }
        }
        
        print(f"📈 Generated transaction history analysis: {total_transactions} transactions, ${total_volume:.2f} volume")
        return transaction_analysis
    
    def generate_revenue_tracking_report(self, period: str = "monthly") -> Dict[str, Any]:
        """
        Generate revenue tracking report with trends
        """
        # Get revenue data
        revenue_data = self._get_revenue_data(period)
        
        # Convert to DataFrame
        df = pd.DataFrame(revenue_data)
        
        # Calculate growth rates using numpy
        revenues = df['revenue'].values
        growth_rates = np.diff(revenues) / revenues[:-1] * 100
        
        # Calculate trends
        avg_growth = np.mean(growth_rates) if len(growth_rates) > 0 else 0
        total_revenue = np.sum(revenues)
        
        revenue_tracking = {
            'report_type': 'Revenue_Tracking',
            'generated_at': datetime.now().isoformat(),
            'period': period,
            'total_revenue': float(total_revenue),
            'average_growth_rate': float(avg_growth),
            'revenue_by_period': df.to_dict('records'),
            'trends': {
                'highest_revenue_period': df.loc[df['revenue'].idxmax()].to_dict() if not df.empty else None,
                'lowest_revenue_period': df.loc[df['revenue'].idxmin()].to_dict() if not df.empty else None,
                'growth_trend': 'increasing' if avg_growth > 0 else 'decreasing'
            }
        }
        
        print(f"💰 Generated revenue tracking report: ${total_revenue:.2f} total, {avg_growth:.2f}% avg growth")
        return revenue_tracking
    
    def generate_investment_return_report(self) -> Dict[str, Any]:
        """
        Generate investment return calculations
        """
        # Get investment data
        investment_data = self._get_investment_return_data()
        
        # Convert to DataFrame
        df = pd.DataFrame(investment_data)
        
        # Calculate returns using numpy
        initial_investments = df['initial_investment'].values
        current_values = df['current_value'].values
        returns = (current_values - initial_investments) / initial_investments * 100
        
        # Calculate statistics
        total_invested = np.sum(initial_investments)
        total_current_value = np.sum(current_values)
        total_return = (total_current_value - total_invested) / total_invested * 100
        
        investment_return_report = {
            'report_type': 'Investment_Return_Report',
            'generated_at': datetime.now().isoformat(),
            'total_invested': float(total_invested),
            'total_current_value': float(total_current_value),
            'total_return_percentage': float(total_return),
            'individual_investments': [
                {
                    'investment_id': inv['investment_id'],
                    'initial_investment': float(inv['initial_investment']),
                    'current_value': float(inv['current_value']),
                    'return_percentage': float(ret)
                }
                for inv, ret in zip(investment_data, returns)
            ],
            'statistics': {
                'best_performing': float(np.max(returns)),
                'worst_performing': float(np.min(returns)),
                'average_return': float(np.mean(returns)),
                'median_return': float(np.median(returns))
            }
        }
        
        print(f"📊 Generated investment return report: {total_return:.2f}% total return on ${total_invested:.2f}")
        return investment_return_report
    
    def generate_platform_fee_analysis(self) -> Dict[str, Any]:
        """
        Generate platform fee analysis
        """
        # Get fee data
        fee_data = self._get_platform_fee_data()
        
        # Convert to DataFrame
        df = pd.DataFrame(fee_data)
        
        # Calculate statistics
        total_fees = df['fee_amount'].sum()
        total_transactions = len(df)
        average_fee = df['fee_amount'].mean()
        
        # Group by fee type
        fee_type_breakdown = df.groupby('fee_type').agg({
            'fee_amount': ['sum', 'count', 'mean']
        }).to_dict()
        
        platform_fee_analysis = {
            'report_type': 'Platform_Fee_Analysis',
            'generated_at': datetime.now().isoformat(),
            'total_fees_collected': float(total_fees),
            'total_transactions': int(total_transactions),
            'average_fee': float(average_fee),
            'fee_type_breakdown': fee_type_breakdown,
            'fee_details': df.to_dict('records')
        }
        
        print(f"💳 Generated platform fee analysis: ${total_fees:.2f} from {total_transactions} transactions")
        return platform_fee_analysis
    
    def _get_sales_data(self, start_date: Optional[str], end_date: Optional[str]) -> List[Dict[str, Any]]:
        """Mock sales data"""
        return [
            {
                'sale_id': 'sale_001',
                'item_id': 'item_001',
                'category': 'Electronics',
                'amount': 50.00,
                'timestamp': '2024-01-15T10:30:00',
                'buyer_name': 'John Doe',
                'buyer_email': 'john@example.com',
                'buyer_address': '123 Main St, San Francisco, CA 94102',
                'buyer_phone': '555-0101'
            },
            {
                'sale_id': 'sale_002',
                'item_id': 'item_002',
                'category': 'Outdoor',
                'amount': 20.00,
                'timestamp': '2024-01-16T14:15:00',
                'buyer_name': 'Jane Smith',
                'buyer_email': 'jane@example.com',
                'buyer_address': '456 Oak Ave, Oakland, CA 94601',
                'buyer_phone': '555-0102'
            },
            {
                'sale_id': 'sale_003',
                'item_id': 'item_003',
                'category': 'Electronics',
                'amount': 100.00,
                'timestamp': '2024-01-17T09:45:00',
                'buyer_name': 'Bob Johnson',
                'buyer_email': 'bob@example.com',
                'buyer_address': '789 Pine Rd, Berkeley, CA 94704',
                'buyer_phone': '555-0103'
            }
        ]
    
    def _get_transaction_data(self, user_id: Optional[str]) -> List[Dict[str, Any]]:
        """Mock transaction data"""
        return [
            {'transaction_id': 'txn_001', 'user_id': 'user_001', 'amount': 50.00, 'transaction_type': 'rental', 'timestamp': '2024-01-15T10:30:00'},
            {'transaction_id': 'txn_002', 'user_id': 'user_002', 'amount': 20.00, 'transaction_type': 'deposit', 'timestamp': '2024-01-16T14:15:00'},
            {'transaction_id': 'txn_003', 'user_id': 'user_001', 'amount': 100.00, 'transaction_type': 'investment', 'timestamp': '2024-01-17T09:45:00'},
        ]
    
    def _get_revenue_data(self, period: str) -> List[Dict[str, Any]]:
        """Mock revenue data"""
        return [
            {'period': '2024-01', 'revenue': 5000.00},
            {'period': '2024-02', 'revenue': 5500.00},
            {'period': '2024-03', 'revenue': 6200.00},
        ]
    
    def _get_investment_return_data(self) -> List[Dict[str, Any]]:
        """Mock investment return data"""
        return [
            {'investment_id': 'inv_001', 'initial_investment': 1000.00, 'current_value': 1150.00},
            {'investment_id': 'inv_002', 'initial_investment': 500.00, 'current_value': 475.00},
            {'investment_id': 'inv_003', 'initial_investment': 2000.00, 'current_value': 2300.00},
        ]
    
    def _get_platform_fee_data(self) -> List[Dict[str, Any]]:
        """Mock platform fee data"""
        return [
            {'transaction_id': 'txn_001', 'fee_type': 'rental_fee', 'fee_amount': 5.00},
            {'transaction_id': 'txn_002', 'fee_type': 'deposit_fee', 'fee_amount': 2.00},
            {'transaction_id': 'txn_003', 'fee_type': 'investment_fee', 'fee_amount': 10.00},
        ]
    
    def _generalize_address(self, address: str) -> str:
        """Generalize address for PII protection"""
        parts = address.split(',')
        if len(parts) >= 2:
            return f"{parts[-2].strip()}, {parts[-1].strip()}"
        return "Location Hidden"
    
    def _mask_phone(self, phone: str) -> str:
        """Mask phone number for PII protection"""
        if len(phone) >= 4:
            return f"***-***-{phone[-4:]}"
        return "***-****"

# Export the main class
__all__ = ['SalesReportGenerator', 'SalesReportData']

