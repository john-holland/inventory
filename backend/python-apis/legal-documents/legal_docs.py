"""
Legal Document Generation System
Generates Terms of Service, Mission Statement, Privacy Policy, User Agreement, and Investment Risk Disclosure
"""

from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
import json

@dataclass
class LegalDocumentData:
    document_type: str
    user_role: str
    platform_features: List[str]
    legal_requirements: List[str]
    company_values: List[str]
    platform_goals: List[str]

class LegalDocumentGenerator:
    def __init__(self):
        print("⚖️ Legal Document Generator initialized")
    
    def generate_terms_of_service(self, platform_features: List[str], legal_requirements: List[str]) -> Dict[str, Any]:
        """
        Generate platform-specific Terms of Service with investment disclosure
        """
        # Platform-specific clauses based on features
        clauses = []
        
        if "item_lending_borrowing" in platform_features:
            clauses.append({
                "section": "Item Lending and Borrowing",
                "content": "Users may lend and borrow items through our platform. All transactions are subject to our lending agreement terms."
            })
        
        if "investment_holds" in platform_features:
            clauses.append({
                "section": "Investment Holds",
                "content": "Users may invest additional funds beyond shipping holds. Investment returns are not guaranteed and subject to market risk."
            })
        
        if "risky_investment_mode" in platform_features:
            clauses.append({
                "section": "Risky Investment Mode",
                "content": "Users may opt into risky investment mode with additional collateral requirements. This mode carries significant financial risk."
            })
        
        if "shipstation_optimization" in platform_features:
            clauses.append({
                "section": "Shipping Optimization",
                "content": "We may automatically optimize shipping labels to reduce costs. Savings may be reinvested in user accounts."
            })
        
        if "tax_document_generation" in platform_features:
            clauses.append({
                "section": "Tax Document Generation",
                "content": "We provide tax document generation services. Users are responsible for verifying accuracy and filing requirements."
            })
        
        # Legal requirements
        legal_clauses = []
        if "user_agreement" in legal_requirements:
            legal_clauses.append("User Agreement: Users must agree to platform terms before using services.")
        
        if "investment_disclosure" in legal_requirements:
            legal_clauses.append("Investment Disclosure: All investments carry risk of loss. Past performance does not guarantee future results.")
        
        if "privacy_protection" in legal_requirements:
            legal_clauses.append("Privacy Protection: User data is protected according to our privacy policy and applicable laws.")
        
        terms_of_service = {
            'document_type': 'Terms_of_Service',
            'platform_features': platform_features,
            'legal_requirements': legal_requirements,
            'clauses': clauses,
            'legal_clauses': legal_clauses,
            'generated_at': datetime.now().isoformat(),
            'version': '1.0',
            'effective_date': datetime.now().strftime('%Y-%m-%d')
        }
        
        print(f"📋 Generated Terms of Service with {len(clauses)} platform-specific clauses")
        return terms_of_service
    
    def generate_mission_statement(self, company_values: List[str], platform_goals: List[str]) -> Dict[str, Any]:
        """
        Generate Mission Statement with company values and platform goals
        """
        # Company values articulation
        values_section = []
        for value in company_values:
            if value == "transparency":
                values_section.append("We believe in complete transparency in all platform operations and user interactions.")
            elif value == "user_empowerment":
                values_section.append("We empower users to make informed financial decisions through education and tools.")
            elif value == "financial_inclusion":
                values_section.append("We promote financial inclusion by making investment opportunities accessible to all users.")
            elif value == "sustainable_investment":
                values_section.append("We support sustainable investment practices that benefit both users and communities.")
            elif value == "community_building":
                values_section.append("We build strong communities through shared economic activities and mutual support.")
        
        # Platform goals definition
        goals_section = []
        for goal in platform_goals:
            if goal == "democratize_access_to_items":
                goals_section.append("Democratize access to items through our innovative lending and borrowing platform.")
            elif goal == "enable_alternative_investment":
                goals_section.append("Enable alternative investment opportunities beyond traditional financial markets.")
            elif goal == "create_shared_economy_ecosystem":
                goals_section.append("Create a comprehensive shared economy ecosystem that benefits all participants.")
            elif goal == "promote_financial_literacy":
                goals_section.append("Promote financial literacy through educational resources and practical experience.")
        
        mission_statement = {
            'document_type': 'Mission_Statement',
            'company_values': company_values,
            'platform_goals': platform_goals,
            'values_articulation': values_section,
            'goals_definition': goals_section,
            'generated_at': datetime.now().isoformat(),
            'version': '1.0'
        }
        
        print(f"🎯 Generated Mission Statement with {len(values_section)} values and {len(goals_section)} goals")
        return mission_statement
    
    def generate_privacy_policy(self, pii_controls: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate Privacy Policy with PII protection details
        """
        privacy_sections = []
        
        # Data collection
        privacy_sections.append({
            "section": "Data Collection",
            "content": "We collect only necessary data to provide our services, including user profiles, transaction history, and investment data."
        })
        
        # PII protection
        if pii_controls.get('address_protection', False):
            privacy_sections.append({
                "section": "Address Protection",
                "content": "User addresses are protected through estimation techniques and are not stored in exact form."
            })
        
        if pii_controls.get('financial_data_protection', False):
            privacy_sections.append({
                "section": "Financial Data Protection",
                "content": "All financial data is encrypted and stored securely with industry-standard protection."
            })
        
        if pii_controls.get('role_based_access', False):
            privacy_sections.append({
                "section": "Role-Based Access",
                "content": "Access to personal information is restricted based on user roles and business necessity."
            })
        
        # Data sharing
        privacy_sections.append({
            "section": "Data Sharing",
            "content": "We do not sell user data. Data is only shared with authorized personnel and service providers as necessary."
        })
        
        privacy_policy = {
            'document_type': 'Privacy_Policy',
            'pii_controls': pii_controls,
            'sections': privacy_sections,
            'generated_at': datetime.now().isoformat(),
            'version': '1.0',
            'effective_date': datetime.now().strftime('%Y-%m-%d')
        }
        
        print(f"🔒 Generated Privacy Policy with {len(privacy_sections)} sections")
        return privacy_policy
    
    def generate_user_agreement(self, user_role: str) -> Dict[str, Any]:
        """
        Generate role-specific user agreements
        """
        role_specific_terms = []
        
        if user_role == "borrower":
            role_specific_terms.extend([
                "Borrowers must maintain good standing to continue using the platform.",
                "Borrowers are responsible for returning items in original condition.",
                "Late fees may apply for overdue items."
            ])
        elif user_role == "owner":
            role_specific_terms.extend([
                "Owners must accurately describe items and their condition.",
                "Owners are responsible for item authenticity and legality.",
                "Owners may set their own lending terms within platform guidelines."
            ])
        elif user_role == "employee":
            role_specific_terms.extend([
                "Employees have access to additional platform features and data.",
                "Employees must maintain confidentiality of user information.",
                "Employees are subject to additional security and compliance requirements."
            ])
        elif user_role == "admin":
            role_specific_terms.extend([
                "Administrators have full access to platform systems and data.",
                "Administrators must follow strict security protocols.",
                "Administrators are responsible for platform integrity and user safety."
            ])
        
        user_agreement = {
            'document_type': 'User_Agreement',
            'user_role': user_role,
            'role_specific_terms': role_specific_terms,
            'general_terms': [
                "Users must be at least 18 years old to use the platform.",
                "Users must provide accurate information and update as necessary.",
                "Users are responsible for maintaining account security.",
                "The platform reserves the right to suspend accounts for violations."
            ],
            'generated_at': datetime.now().isoformat(),
            'version': '1.0'
        }
        
        print(f"📝 Generated User Agreement for {user_role} role")
        return user_agreement
    
    def generate_investment_risk_disclosure(self, risk_level: str) -> Dict[str, Any]:
        """
        Generate Investment Risk Disclosure for risky investment mode
        """
        risk_disclosures = []
        
        if risk_level == "low":
            risk_disclosures.extend([
                "Low-risk investments still carry the possibility of loss.",
                "Past performance does not guarantee future results.",
                "Diversification is recommended to reduce risk."
            ])
        elif risk_level == "medium":
            risk_disclosures.extend([
                "Medium-risk investments have moderate volatility.",
                "Losses may occur during market downturns.",
                "Regular monitoring of investments is recommended."
            ])
        elif risk_level == "high":
            risk_disclosures.extend([
                "High-risk investments can result in significant losses.",
                "Only invest funds you can afford to lose completely.",
                "Market volatility can cause rapid value changes."
            ])
        elif risk_level == "risky_mode":
            risk_disclosures.extend([
                "RISKY INVESTMENT MODE: This mode carries extreme risk of total loss.",
                "Anti-investment collateral is required but may not cover all losses.",
                "50/50 loss sharing applies in case of investment failure.",
                "Investment robots may not prevent all losses during market crashes.",
                "Users acknowledge understanding of these risks before enabling risky mode."
            ])
        
        investment_risk_disclosure = {
            'document_type': 'Investment_Risk_Disclosure',
            'risk_level': risk_level,
            'disclosures': risk_disclosures,
            'additional_warnings': [
                "All investments are subject to market risk.",
                "No investment strategy can guarantee profits.",
                "Users should consult financial advisors for complex situations.",
                "Platform fees and taxes may apply to investment returns."
            ],
            'generated_at': datetime.now().isoformat(),
            'version': '1.0'
        }
        
        print(f"⚠️ Generated Investment Risk Disclosure for {risk_level} risk level")
        return investment_risk_disclosure
    
    def generate_platform_usage_guidelines(self, user_types: List[str]) -> Dict[str, Any]:
        """
        Generate Platform Usage Guidelines for all user types
        """
        guidelines = []
        
        # General guidelines
        guidelines.extend([
            "Respect all platform users and maintain professional conduct.",
            "Report any suspicious or inappropriate behavior immediately.",
            "Follow all applicable laws and regulations in your jurisdiction.",
            "Do not attempt to circumvent platform security measures."
        ])
        
        # User type specific guidelines
        if "borrower" in user_types:
            guidelines.extend([
                "Borrowers must return items in the same condition received.",
                "Communicate promptly with item owners about any issues.",
                "Follow all agreed-upon terms for item use."
            ])
        
        if "owner" in user_types:
            guidelines.extend([
                "Owners must accurately represent items and their condition.",
                "Respond promptly to borrower inquiries and requests.",
                "Maintain items in good condition for lending."
            ])
        
        if "employee" in user_types:
            guidelines.extend([
                "Employees must maintain confidentiality of user information.",
                "Follow all company policies and procedures.",
                "Report any security concerns immediately."
            ])
        
        platform_usage_guidelines = {
            'document_type': 'Platform_Usage_Guidelines',
            'user_types': user_types,
            'guidelines': guidelines,
            'enforcement': [
                "Violations may result in account suspension or termination.",
                "Serious violations may be reported to appropriate authorities.",
                "Users may appeal enforcement actions through our dispute process."
            ],
            'generated_at': datetime.now().isoformat(),
            'version': '1.0'
        }
        
        print(f"📋 Generated Platform Usage Guidelines for {len(user_types)} user types")
        return platform_usage_guidelines

# Export the main class
__all__ = ['LegalDocumentGenerator', 'LegalDocumentData']
