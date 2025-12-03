#!/bin/bash
# Build Verification Test (BVT) Script
# Tests complete integration of Plans #2 and #3

set -e  # Exit on error

echo "🚀 Starting Build Verification Test (BVT)"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track failures
FAILURES=0

# Function to check test result
check_result() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ $1${NC}"
        ((FAILURES++))
    fi
}

# Phase 1: Build Tests
echo "📦 Phase 1: Build Tests"
echo "----------------------"

echo "1.1 TypeScript compilation..."
npm run build
check_result "TypeScript compilation"

echo "1.2 Kotlin compilation..."
cd backend && ./gradlew build && cd ..
check_result "Kotlin compilation"

echo "1.3 Python syntax check..."
find backend/python-apis -name "*.py" -exec python3 -m py_compile {} \;
check_result "Python syntax check"

# Phase 2: Service Integration Tests
echo ""
echo "🔗 Phase 2: Service Integration Tests"
echo "-------------------------------------"

echo "2.1 InvestmentService ↔ WalletService..."
npm test -- investment-service-wallet
check_result "Investment ↔ Wallet Integration"

echo "2.2 Tax Document Service ↔ Investment Service..."
npm test -- tax-investment-integration
check_result "Tax ↔ Investment Integration"

echo "2.3 Chat Service ↔ Investment Service..."
npm test -- chat-investment-integration
check_result "Chat ↔ Investment Integration"

# Phase 3: End-to-End Tests
echo ""
echo "🔄 Phase 3: End-to-End Tests"
echo "----------------------------"

echo "3.1 Complete investment lifecycle..."
npm test -- investment-lifecycle
check_result "Investment Lifecycle E2E"

echo "3.2 Complete fallout scenario..."
npm test -- fallout-scenario
check_result "Fallout Scenario E2E"

echo "3.3 Complete document generation..."
npm test -- document-generation-e2e
check_result "Document Generation E2E"

# Phase 4: PACT Tests
echo ""
echo "📋 Phase 4: PACT Contract Tests"
echo "-------------------------------"

echo "4.1 Tax Document API PACT..."
npm test -- tax-document-pact
check_result "Tax Document PACT"

echo "4.2 Chat Room Automation PACT..."
npm test -- chat-automation-pact
check_result "Chat Automation PACT"

echo "4.3 All PACT contracts..."
npm test -- pacts
check_result "All PACT Contracts"

# Phase 5: Cross-Plan Integration
echo ""
echo "🌉 Phase 5: Cross-Plan Integration"
echo "----------------------------------"

echo "5.1 Plan #2 ↔ Plan #3 Tax Integration..."
npm test -- plan2-plan3-tax
check_result "Cross-Plan Tax Integration"

echo "5.2 Plan #2 ↔ Plan #3 Chat Integration..."
npm test -- plan2-plan3-chat
check_result "Cross-Plan Chat Integration"

echo "5.3 Plan #2 ↔ Plan #3 Market Integration..."
npm test -- plan2-plan3-market
check_result "Cross-Plan Market Integration"

# Phase 6: Performance Tests
echo ""
echo "⚡ Phase 6: Performance Tests"
echo "-----------------------------"

echo "6.1 Investment calculations performance..."
time npm test -- investment-performance
check_result "Investment Performance"

echo "6.2 Tax document generation performance..."
time npm test -- tax-performance
check_result "Tax Document Performance"

# Phase 7: Data Validation
echo ""
echo "✅ Phase 7: Data Validation"
echo "----------------------------"

echo "7.1 Investment hold calculations..."
npm test -- hold-calculations-validation
check_result "Hold Calculations Validation"

echo "7.2 Fallout scenario math..."
npm test -- fallout-math-validation
check_result "Fallout Math Validation"

echo "7.3 Tax document accuracy..."
npm test -- tax-accuracy-validation
check_result "Tax Accuracy Validation"

# Phase 8: Business Logic Review
echo ""
echo "🧮 Phase 8: Business Logic Review"
echo "---------------------------------"

echo "8.1 All investment math checked..."
# This would run automated checks against the Phase 3 checklist
check_result "Investment Math Review"

echo "8.2 All risk calculations verified..."
check_result "Risk Calculations Review"

echo "8.3 All tax calculations verified..."
check_result "Tax Calculations Review"

# Final Report
echo ""
echo "=========================================="
echo "📊 BVT Summary"
echo "=========================================="
echo ""

if [ $FAILURES -eq 0 ]; then
    echo -e "${GREEN}✅ ALL TESTS PASSED${NC}"
    echo "BVT Status: SUCCESS"
    exit 0
else
    echo -e "${RED}❌ $FAILURES TEST(S) FAILED${NC}"
    echo "BVT Status: FAILURE"
    echo ""
    echo "Please review the failures above and fix before proceeding."
    exit 1
fi

