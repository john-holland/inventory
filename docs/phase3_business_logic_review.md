# Phase 3: Business Logic Math Review Checklist

## Overview
Comprehensive review of all mathematical calculations and business logic across Plans #2 and #3 to ensure accuracy, consistency, and compliance with business rules.

---

## A. Investment & Risk Calculations (Plan #3)

### Investment Hold Calculations
- [ ] Shipping Hold 2x = 2 × shipping cost (NON-investable)
- [ ] Additional Hold = 1x shipping cost (immediately investable)
- [ ] Insurance Hold = Variable amount (investable after shipping)
- [ ] Total Non-Investable = Shipping Hold 2x only
- [ ] Total Investable = Additional Hold + Insurance Hold
- [ ] Verify: Shipping Hold 2x prevents investment until threshold secured

### Risky Investment Mode Calculations
- [ ] Risk Percentage = User-selected % (0-100%)
- [ ] Amount at Risk = (Shipping Hold 2x × Risk Percentage) / 100
- [ ] Risk Boundary Error = Dynamic market assessment (typically 15-25%)
- [ ] Anti-Collateral Required = Amount at Risk × Risk Boundary Error
- [ ] Verify: Anti-collateral = opposite of risk boundary error
- [ ] Validate: Anti-collateral ≥ 20% of shipping cost (minimum threshold)

### Investment Return Calculations
- [ ] Current Investments = Sum of all invested holds
- [ ] Investment Return = Current value - Initial value
- [ ] Investment Return Percentage = (Investment Return / Current Investments) × 100
- [ ] Expected Return Formula: Total Hold × (Return Rate / 365) × Hold Duration Days

### Fallout Scenario Math (50/50 Split)
- [ ] Total Loss = Initial Investment - Current Value
- [ ] Shipping Cost = Base shipping cost
- [ ] Insurance Cost = Insurance hold amount
- [ ] Total Costs = Shipping Cost + Insurance Cost
- [ ] Borrower Share = Total Costs × 0.5
- [ ] Owner Share = Total Costs × 0.5
- [ ] Investment Loss = Total Loss - Total Costs
- [ ] Borrower Capital Loss = Investment Loss × 0.5
- [ ] Owner Capital Loss = Investment Loss × 0.5
- [ ] Shipping Refund = Shipping Cost × 0.5
- [ ] Insurance Refund = Insurance Cost × 0.5
- [ ] Verify: Total refunds = Borrower Share + Owner Share = Total Costs
- [ ] Verify: Capital losses are separate from shipping/insurance refunds

---

## B. Shipping & Optimization Calculations (Plan #3)

### Shipping Hold Processing
- [ ] 2x Shipping Hold Amount = Shipping Cost × 2
- [ ] Additional Hold Amount = User-provided (typically 1x shipping cost)
- [ ] Insurance Hold Amount = User-provided or calculated based on item value
- [ ] Total Required for Item = 2x Hold + Additional Hold + Insurance Hold
- [ ] Verify: Minimum payment = 2x shipping cost (required)
- [ ] Verify: Maximum payment = 3x shipping cost (standard limit)

### ShipStation Optimization
- [ ] Original Rate = Current shipping label cost
- [ ] Optimized Rate = Best alternative rate found
- [ ] Potential Savings = Original Rate - Optimized Rate
- [ ] Minimum Savings Threshold = $2.00 (configurable)
- [ ] Optimization Eligible = (Potential Savings ≥ Minimum Threshold) AND (Refund Free)
- [ ] Reinvestment Amount = Potential Savings (automatically reinvested if enabled)
- [ ] Verify: Only optimize if label refund is FREE
- [ ] Verify: Conservative approach (only when clearly beneficial)

---

## C. Tax Document Calculations (Plan #2)

### Capital Loss Reports
- [ ] Borrower Capital Loss = (Total Loss - Total Costs) × 0.5
- [ ] Owner Capital Loss = (Total Loss - Total Costs) × 0.5
- [ ] Total Investment Loss = Investment Loss
- [ ] Reportable = True (both parties can report on taxes)
- [ ] Tax Year = Current year
- [ ] Verify: Capital losses are separate from shipping/insurance costs
- [ ] Verify: Both parties receive equal capital loss amounts

### Tax Document Generation
- [ ] W2 Calculation: Wages + Federal taxes withheld + State taxes withheld
- [ ] 1099-C Calculation: Debt cancellation amount + Creditor information
- [ ] VAT Calculation: Business transactions × VAT rate
- [ ] Investment Gains/Losses: Sum of all investment transactions
- [ ] Employee Tax Documents: Based on employment period and compensation
- [ ] Verify: All tax amounts are calculated accurately
- [ ] Verify: All tax documents comply with IRS requirements

---

## D. Document Generation Logic (Plan #2)

### Inventory Reports
- [ ] Items by Size Calculation
- [ ] Price Totals (when including prices)
- [ ] Movement Tracking
- [ ] Audit Trail Calculations

### Sales Reports
- [ ] Total Sales Revenue
- [ ] Transaction Count
- [ ] Average Transaction Value
- [ ] Revenue by Period
- [ ] PII Protection Logic (role-based filtering)

### Legal Documents
- [ ] Terms of Service Version Control
- [ ] Mission Statement Effective Date
- [ ] Privacy Policy Updates
- [ ] User Agreement Acceptance Tracking

---

## E. Market Monitoring Calculations (Plan #2)

### Variable Flywheel Cron
- [ ] Market Volatility = Standard deviation of price changes
- [ ] Risk Boundary Error = Max(Volatility, 0.25) (capped at 25%)
- [ ] Gear Selection: 
  - Low: Volatility < 0.05 → 24 hour interval
  - Medium: 0.05 ≤ Volatility < 0.10 → 6 hour interval
  - High: 0.10 ≤ Volatility < 0.20 → 1 hour interval
  - Very High: Volatility ≥ 0.20 → 15 minute interval
- [ ] API Rate Limit Management = 100 calls per period
- [ ] Greedy Query Optimization: Maximize queries within rate limit
- [ ] Verify: Frequency adjusts based on market conditions
- [ ] Verify: Rate limits are respected

### ML Warehousing Metrics
- [ ] Market Data Points Collected
- [ ] Cron Job Success Rate
- [ ] Response Time Tracking
- [ ] Error Rate Calculation
- [ ] Optimal Frequency Recommendation
- [ ] Data Point to API Call Ratio

---

## F. Chat Room & Automation Logic (Plan #2)

### Chat Room Creation Rules
- [ ] 11 Chat Room Types: HR, Cabin, Transaction, Dispute, Investment, Shipping, Tax, Market, Dropshipping, Address PII, Legal
- [ ] Each chat room gets unique `chat_room_id`
- [ ] Participant Assignment: Based on context and role
- [ ] Automated Flag: True for system-triggered chats
- [ ] Context Sharing: Investment details, loss calculations, etc.

### Slack Integration
- [ ] Message Sync to Slack
- [ ] Channel Assignment based on chat room type
- [ ] DM Creation for HR help chats
- [ ] Notification Triggers

---

## G. HR Help Integration Math (Plan #2)

### HR Employee Selection
- [ ] Availability Check via Calendar Scheduler
- [ ] Free HR Employees = Filter by available AND role = HR
- [ ] Best HR Employee = First available OR based on expertise match
- [ ] Calendar Scheduler Integration: Check next available slot
- [ ] Context Loading: Relevant documents, FAQ, chat history

### HR Chat Creation
- [ ] Chat Room Type = 'hr_help_1on1'
- [ ] Participants = User + Selected HR Employee
- [ ] Context Sharing: Current page, issues, document context
- [ ] Slack DM Created automatically

---

## H. Cross-Plan Integration Math

### Plan #3 → Plan #2 Tax Generation
- [ ] Fallout Scenario Triggers Tax Document Generation
- [ ] Capital Loss = Investment Loss / 2 (for each party)
- [ ] Tax Properties Stored: itemId, borrowerCapitalLoss, ownerCapitalLoss, totalInvestmentLoss, falloutDate
- [ ] Document Type = 'capital_loss_report'
- [ ] Verify: Tax document includes all fallout details

### Plan #3 → Plan #2 Chat Creation
- [ ] Fallout Triggers 'Dispute' Chat Room Type
- [ ] Participants = Borrower + Owner + Mediator
- [ ] Context = Full fallout details (loss amounts, calculations, refunds)
- [ ] Slack Notification to all participants
- [ ] Verify: Chat room ID is unique and tracked

### Plan #3 Robots → Plan #2 Market Monitoring
- [ ] Robot Activation = New Cron Job Spec Created
- [ ] Frequency Recommendation from ML Warehouse
- [ ] Market Alert Processing → Robot Coordination
- [ ] Emergency Protocol Trigger from Market Alert
- [ ] Verify: Robots coordinate with market monitoring

### Plan #3 ShipStation → Plan #3 Investment
- [ ] Shipping Optimization Savings = Potential Savings
- [ ] Automatic Reinvestment Amount = Savings
- [ ] Investment Transaction Type = 'deposit'
- [ ] Investment Pool Updated
- [ ] Verify: Reinvestment tracked in investment history

---

## I. Validation Rules

### Hold Type Eligibility
- [ ] Shipping Hold 2x: Investable ONLY if risky mode enabled
- [ ] Additional Hold (3rd x): Always investable immediately
- [ ] Insurance Hold: Investable ONLY after item ships
- [ ] Verify: Rules enforced programmatically

### Risk Management Validation
- [ ] Risk Percentage: 0 ≤ x ≤ 100
- [ ] Anti-Collateral: ≥ 20% of shipping cost minimum
- [ ] Anti-Collateral: = Amount at Risk × Risk Boundary Error
- [ ] Verify: All risk parameters validated before risky mode enabled

### Refund & Loss Sharing Validation
- [ ] Total Refunds = Borrower Share + Owner Share = Total Costs
- [ ] Investment Loss ≥ 0 (capital loss can't be negative)
- [ ] Fallout Triggered = True when investment loss > 0
- [ ] Verify: 50/50 split is mathematically correct
- [ ] Verify: Refunds don't exceed original costs

### Tax Document Validation
- [ ] Capital Loss Amounts: Must match investment loss amounts
- [ ] Tax Year: Current year
- [ ] Reportable: True for fallout scenarios
- [ ] Document ID: Unique and tracked
- [ ] Verify: All tax calculations are accurate

---

## J. Edge Cases & Boundary Conditions

### Investment Edge Cases
- [ ] What if Shipping Cost = $0?
- [ ] What if Risk Percentage = 0%?
- [ ] What if Risk Percentage = 100%?
- [ ] What if Anti-Collateral = $0?
- [ ] What if Investment Return is negative?

### Fallout Edge Cases
- [ ] What if Total Loss = 0?
- [ ] What if Investment Loss = 0?
- [ ] What if Borrower can't cover share?
- [ ] What if Owner can't cover share?
- [ ] What if both parties are bankrupt?

### Tax Document Edge Cases
- [ ] What if Capital Loss = 0?
- [ ] What if Tax Year is wrong?
- [ ] What if Document Generation fails?
- [ ] What if Storage fails?

---

## K. Compliance & Legal

### Tax Compliance
- [ ] IRS Capital Loss Reporting Rules Followed
- [ ] 1099-C Reporting Requirements Met
- [ ] W2 Generation Compliant with IRS Standards
- [ ] Document Retention Period Set

### Risk Disclosure
- [ ] Users warned about risky investment mode
- [ ] 50/50 loss sharing clearly explained
- [ ] Anti-collateral requirements transparent
- [ ] Investment robots monitoring explained

### Privacy & PII
- [ ] Address PII blocking for customers
- [ ] Role-based access to PII
- [ ] Unleash feature toggles for sensitive data
- [ ] Employee/CSR vs Customer permissions

---

## L. Testing & Verification

### Mathematical Accuracy Tests
- [ ] All calculation tests pass
- [ ] Edge case tests pass
- [ ] Boundary condition tests pass
- [ ] Integration tests verify math consistency

### Business Logic Tests
- [ ] Investment eligibility rules enforced
- [ ] Risk management rules enforced
- [ ] Fallout scenario calculations correct
- [ ] Tax document calculations correct

### Integration Tests
- [ ] Plan #2 ↔ Plan #3 integration works
- [ ] Cross-service math consistency verified
- [ ] End-to-end scenarios tested

---

## Review Completion Criteria

- [ ] All checkboxes completed
- [ ] All math verified manually
- [ ] All business rules validated
- [ ] All edge cases handled
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Code review completed
- [ ] Stakeholder approval received
- [ ] **Build verification test passed** ← NEW CRITICAL STEP

---

## Build Verification Test (BVT) Design

### BVT Purpose
Verify that all components build, integrate, and run correctly together after implementation.

### BVT Structure

#### 1. Build Tests
- [ ] All TypeScript files compile without errors
- [ ] All Kotlin files compile without errors
- [ ] All Python files syntax-check
- [ ] All dependencies resolve correctly
- [ ] No circular dependencies
- [ ] Build completes in < 5 minutes

#### 2. Service Integration Tests
- [ ] InvestmentService ↔ WalletService
- [ ] InvestmentService ↔ ShipStationService
- [ ] InvestmentService ↔ ShippingService
- [ ] InvestmentService ↔ InvestmentRobotService
- [ ] Tax Document Service ↔ Investment Service
- [ ] Chat Service ↔ Investment Service
- [ ] HR Help Service ↔ Chat Service
- [ ] Slack Service ↔ Chat Service
- [ ] Market Monitoring ↔ Investment Robots
- [ ] Documents Page ↔ All Services

#### 3. End-to-End Workflow Tests
- [ ] Complete investment lifecycle
- [ ] Complete fallout scenario
- [ ] Complete shipping optimization
- [ ] Complete HR help flow
- [ ] Complete document generation

#### 4. Data Flow Verification
- [ ] Investment holds tracked correctly
- [ ] Fallout calculations produce correct results
- [ ] Tax documents contain accurate data
- [ ] Chat rooms created with proper IDs
- [ ] Slack sync works for all message types
- [ ] ML warehouse collects correct metrics

#### 5. Error Handling Tests
- [ ] Graceful degradation on service failures
- [ ] Rollback mechanisms work
- [ ] Error messages are user-friendly
- [ ] Audit trail captures all errors
- [ ] Recovery procedures validated

#### 6. Performance Tests
- [ ] Investment calculations complete in < 100ms
- [ ] Tax document generation < 2 seconds
- [ ] Chat room creation < 500ms
- [ ] Market monitoring responses < 50ms
- [ ] Database queries optimized
- [ ] No memory leaks detected

#### 7. Security Tests
- [ ] PII properly protected
- [ ] Role-based access enforced
- [ ] API authentication required
- [ ] Financial calculations protected
- [ ] Audit logs immutable

#### 8. UI/UX Tests
- [ ] All modals display correctly
- [ ] All forms validate input
- [ ] All buttons trigger correct actions
- [ ] All data displays formatted correctly
- [ ] Mobile responsive
- [ ] Accessibility standards met

---

## BVT Execution Plan

### Pre-BVT Checklist
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] All PACT contracts validated
- [ ] Linting passes
- [ ] Type checking passes
- [ ] Code coverage > 80%

### BVT Execution
1. **Build Phase** (5 minutes)
   - Clean build
   - Compile all services
   - Generate documentation
   
2. **Service Tests** (10 minutes)
   - Run all service integration tests
   - Verify service-to-service communication
   
3. **E2E Tests** (15 minutes)
   - Run complete user journey tests
   - Verify cross-plan integration
   
4. **Performance Tests** (5 minutes)
   - Measure response times
   - Check resource usage
   
5. **Security Scan** (5 minutes)
   - Vulnerability scan
   - Access control verification

### BVT Success Criteria
- [ ] All builds successful
- [ ] All tests passing
- [ ] No critical errors
- [ ] Performance within acceptable limits
- [ ] Security scan clean
- [ ] User journey completes successfully

### BVT Failure Handling
- Auto-generate failure report
- Create JIRA tickets for failed tests
- Notify team of blocking issues
- Provide rollback procedures

---

## Notes

- Ensure all monetary calculations use consistent precision (2 decimal places)
- Verify floating-point arithmetic doesn't cause rounding errors
- All percentages should be stored as decimals (0.15, not 15%)
- Date calculations should use timezone-aware timestamps
- Audit trail should track all calculation steps
- Mathematical proofs should be documented for complex calculations

---

## Review Assignments

- Investment & Risk Math: [ ] Reviewed by _________________
- Shipping & Optimization Math: [ ] Reviewed by _________________
- Tax Document Math: [ ] Reviewed by _________________
- Market Monitoring Math: [ ] Reviewed by _________________
- Cross-Plan Integration: [ ] Reviewed by _________________
- Edge Cases & Compliance: [ ] Reviewed by _________________

---

## Sign-off

- [ ] Technical Lead: _________________ Date: ________
- [ ] Business Analyst: _________________ Date: ________
- [ ] Compliance Officer: _________________ Date: ________
- [ ] QA Lead: _________________ Date: ________
