"""
Tax Document Generation System
Generates W2, 1099-C, investment documents, and capital loss reports
"""

import numpy as np
import pandas as pd
from datetime import datetime, date
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
import json

@dataclass
class TaxDocumentData:
    user_id: str
    year: int
    wages: float
    taxes_withheld: float
    investment_gains: float
    investment_losses: float
    capital_losses: float
    cancelled_debt: float

class TaxDocumentGenerator:
    def __init__(self):
        self.numpy = np
        self.pandas = pd
        print("📊 Tax Document Generator initialized")
    
    def generate_w2_form(self, user_id: str, year: int) -> Dict[str, Any]:
        """
        Generate W2 form with numpy calculations for accuracy
        """
        # Simulate user data - in production, this would come from database
        user_data = self._get_user_tax_data(user_id, year)
        
        # Use numpy for precise calculations
        wages = np.float64(user_data['wages'])
        taxes_withheld = np.float64(user_data['taxes_withheld'])
        
        # Calculate additional tax fields using numpy
        social_security_wages = np.minimum(wages, 160200)  # 2023 SS wage base
        medicare_wages = wages  # No cap on Medicare
        social_security_tax = np.multiply(social_security_wages, 0.062)
        medicare_tax = np.multiply(medicare_wages, 0.0145)
        
        w2_data = {
            'user_id': user_id,
            'year': year,
            'wages': float(wages),
            'taxes_withheld': float(taxes_withheld),
            'social_security_wages': float(social_security_wages),
            'social_security_tax': float(social_security_tax),
            'medicare_wages': float(medicare_wages),
            'medicare_tax': float(medicare_tax),
            'generated_at': datetime.now().isoformat(),
            'document_type': 'W2'
        }
        
        print(f"📄 Generated W2 for user {user_id}, year {year}")
        return w2_data
    
    def generate_1099c_form(self, user_id: str, year: int) -> Dict[str, Any]:
        """
        Generate 1099-C form for cancelled debt
        """
        user_data = self._get_user_tax_data(user_id, year)
        cancelled_debt = np.float64(user_data['cancelled_debt'])
        
        # Calculate tax implications using numpy
        taxable_amount = np.maximum(cancelled_debt, 0)  # Can't be negative
        
        form_1099c = {
            'user_id': user_id,
            'year': year,
            'cancelled_debt': float(cancelled_debt),
            'taxable_amount': float(taxable_amount),
            'generated_at': datetime.now().isoformat(),
            'document_type': '1099-C'
        }
        
        print(f"📄 Generated 1099-C for user {user_id}, year {year}")
        return form_1099c
    
    def generate_investment_documents(self, user_id: str, year: int) -> Dict[str, Any]:
        """
        Generate investment gains/losses documentation
        """
        user_data = self._get_user_tax_data(user_id, year)
        
        # Use numpy for investment calculations
        gains = np.float64(user_data['investment_gains'])
        losses = np.float64(user_data['investment_losses'])
        net_gain_loss = np.subtract(gains, losses)
        
        # Calculate tax implications
        short_term_gains = np.multiply(gains, 0.22)  # Assume 22% tax rate
        long_term_gains = np.multiply(gains, 0.15)   # Assume 15% tax rate
        
        investment_docs = {
            'user_id': user_id,
            'year': year,
            'total_gains': float(gains),
            'total_losses': float(losses),
            'net_gain_loss': float(net_gain_loss),
            'short_term_tax': float(short_term_gains),
            'long_term_tax': float(long_term_gains),
            'generated_at': datetime.now().isoformat(),
            'document_type': 'Investment_Gains_Losses'
        }
        
        print(f"📈 Generated investment documents for user {user_id}, year {year}")
        return investment_docs
    
    def generate_capital_loss_report(self, fallout_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate capital loss report for risky investment fallout scenarios
        """
        # Extract fallout data
        total_loss = np.float64(fallout_data['total_loss'])
        borrower_share = np.float64(fallout_data['borrower_share'])
        owner_share = np.float64(fallout_data['owner_share'])
        investment_loss = np.float64(fallout_data['investment_loss'])
        
        # Calculate capital loss for tax purposes
        borrower_capital_loss = np.divide(investment_loss, 2)
        owner_capital_loss = np.divide(investment_loss, 2)
        
        # Calculate tax benefits (capital losses can offset gains)
        borrower_tax_benefit = np.multiply(borrower_capital_loss, 0.22)  # 22% tax rate
        owner_tax_benefit = np.multiply(owner_capital_loss, 0.22)
        
        capital_loss_report = {
            'fallout_id': fallout_data.get('fallout_id', 'unknown'),
            'total_loss': float(total_loss),
            'borrower_share': float(borrower_share),
            'owner_share': float(owner_share),
            'investment_loss': float(investment_loss),
            'borrower_capital_loss': float(borrower_capital_loss),
            'owner_capital_loss': float(owner_capital_loss),
            'borrower_tax_benefit': float(borrower_tax_benefit),
            'owner_tax_benefit': float(owner_tax_benefit),
            'generated_at': datetime.now().isoformat(),
            'document_type': 'Capital_Loss_Report'
        }
        
        print(f"💸 Generated capital loss report for fallout {fallout_data.get('fallout_id', 'unknown')}")
        return capital_loss_report
    
    def calculate_vat_tax(self, user_id: str, transactions: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Calculate VAT tax for international users
        """
        # Convert transactions to pandas DataFrame for analysis
        df = pd.DataFrame(transactions)
        
        if df.empty:
            return {'user_id': user_id, 'vat_amount': 0.0, 'vat_rate': 0.0}
        
        # Calculate VAT using pandas
        total_amount = df['amount'].sum()
        vat_rate = 0.20  # 20% VAT rate (example)
        vat_amount = np.multiply(total_amount, vat_rate)
        
        # Group by country for different VAT rates
        country_vat = df.groupby('country')['amount'].sum() * vat_rate
        
        vat_calculation = {
            'user_id': user_id,
            'total_transactions': len(transactions),
            'total_amount': float(total_amount),
            'vat_rate': vat_rate,
            'vat_amount': float(vat_amount),
            'country_breakdown': country_vat.to_dict(),
            'generated_at': datetime.now().isoformat(),
            'document_type': 'VAT_Calculation'
        }
        
        print(f"🌍 Calculated VAT for user {user_id}: ${vat_amount:.2f}")
        return vat_calculation
    
    def _get_user_tax_data(self, user_id: str, year: int) -> Dict[str, Any]:
        """
        Mock function to get user tax data - in production, this would query database
        """
        # Simulate user data based on user_id and year
        base_wages = 50000 + (hash(user_id) % 10000)
        base_investments = 5000 + (hash(user_id) % 2000)
        
        return {
            'wages': base_wages,
            'taxes_withheld': base_wages * 0.22,  # 22% tax rate
            'investment_gains': base_investments * 0.15,  # 15% gains
            'investment_losses': base_investments * 0.05,  # 5% losses
            'capital_losses': base_investments * 0.10,  # 10% capital losses
            'cancelled_debt': base_wages * 0.02,  # 2% cancelled debt
        }

# Export the main class
__all__ = ['TaxDocumentGenerator', 'TaxDocumentData']
