# Build Verification Test (BVT) Specification

## Overview

The Build Verification Test (BVT) is a comprehensive test suite that validates the complete integration of Plans #2 and #3, ensuring all components build, integrate, and perform within acceptable parameters.

## BVT Scope

### Systems Under Test
- **Plan #3**: Item Details + Risky Investment Mode
- **Plan #2**: Tax & Document Generation System
- **Integration Layer**: Cross-plan data flow and service coordination

### Test Environment
- **Frontend**: React + TypeScript
- **Backend**: Kotlin (Spring Boot)
- **Python APIs**: Document generation, ML warehousing
- **Database**: PostgreSQL (schema validation)
- **External Services**: Slack, iCal, Google Suite, Outlook

---

## BVT Test Categories

### 1. Build & Compilation Tests

#### 1.1 TypeScript Compilation
```bash
✅ ALL TypeScript files compile without errors
⚠️  Allow up to 10 warnings (deprecation notices)
❌ FAIL if any compilation errors
```

**Test Commands:**
- `npm run build` - Frontend build
- `npm run type-check` - TypeScript checking
- `npm run lint` - Linting

**Success Criteria:**
- Zero compilation errors
- Warning count ≤ 10
- Build completes in < 60 seconds

#### 1.2 Kotlin Compilation
```bash
✅ ALL Kotlin files compile without errors
✅ Spring Boot application builds successfully
✅ All dependencies resolve correctly
```

**Test Commands:**
- `./gradlew build` - Backend build
- `./gradlew test` - Unit tests
- `./gradlew check` - Code quality checks

**Success Criteria:**
- Zero compilation errors
- All unit tests pass
- Build completes in < 3 minutes

#### 1.3 Python Syntax Validation
```bash
✅ ALL Python files pass syntax check
✅ All imports resolve correctly
✅ No import errors or circular dependencies
```

**Test Commands:**
- `python3 -m py_compile backend/python-apis/**/*.py`
- `pip install -r backend/python-apis/requirements.txt`

**Success Criteria:**
- Zero syntax errors
- All imports valid
- No circular dependencies

---

### 2. Service Integration Tests

#### 2.1 InvestmentService ↔ WalletService

**Test Case**: Investment hold creation and tracking
```typescript
// Verify:
1. Shipping hold (2x) created correctly
2. Additional hold (3rd x) created correctly
3. Insurance hold created correctly
4. Hold balances tracked accurately
5. Transaction history recorded
```

**Assertions:**
- `shippingHold2x = shippingCost × 2`
- `totalInvestable = additionalHold + insuranceHold`
- `totalNonInvestable = shippingHold2x`
- All transactions have unique IDs

#### 2.2 Tax Document Service ↔ Investment Service

**Test Case**: Fallout scenario generates tax documents
```typescript
// Verify:
1. Fallout triggers capital loss report generation
2. Tax document contains correct loss amounts
3. Borrower and owner both receive reports
4. Document stored in warehousing
5. Chat room created for dispute
```

**Assertions:**
- `borrowerCapitalLoss = investmentLoss / 2`
- `ownerCapitalLoss = investmentLoss / 2`
- Tax document job ID is unique
- Chat room ID is unique

#### 2.3 Chat Service ↔ Investment Service

**Test Case**: Automated chat room creation for fallout
```typescript
// Verify:
1. Dispute chat room created automatically
2. Participants: borrower, owner, mediator
3. Context includes fallout details
4. Slack sync triggered
5. Welcome messages sent
```

**Assertions:**
- `chat_room_id` is unique and properly formatted
- Participants array contains 3 users
- Context object has all fallout data
- Slack message ID is generated

---

### 3. End-to-End Workflow Tests

#### 3.1 Complete Investment Lifecycle

**Flow:**
```
1. User creates item
2. User pays 2x shipping hold + additional hold + insurance hold
3. User enables risky investment mode
4. User invests holds
5. Item ships → insurance holds investable
6. Investment robot monitors
7. Market downturn detected
8. Robot attempts withdrawal
9. Withdrawal fails → fallout scenario
10. Tax documents generated
11. Chat room created
12. HR help requested
13. All documents downloaded
```

**Verification Points:**
- All holds created correctly
- Risky mode enables with valid anti-collateral
- Investment succeeds
- Fallout calculates 50/50 split correctly
- Tax documents contain accurate data
- Chat room created with proper ID
- All systems integrate smoothly

**Success Criteria:**
- Complete flow executes without errors
- All data calculations are accurate
- All chat room IDs are unique and tracked
- All tax documents generate correctly
- End-to-end time < 30 seconds

#### 3.2 Complete Shipping Optimization Flow

**Flow:**
```
1. Shipment created with original rate
2. ShipStation finds better rate
3. Refund policy checked (FREE)
4. Savings calculated
5. Optimization applied
6. Savings automatically reinvested
7. Investment recorded in wallet
8. History updated
```

**Verification Points:**
- Rate comparison works
- Refund policy validated
- Savings calculated correctly
- Reinvestment triggered automatically
- Transaction recorded in wallet

---

### 4. Data Flow Verification

#### 4.1 Investment Hold Tracking

**Test**: Verify hold amounts are tracked accurately
```typescript
// Test data
shippingCost = 25.00
riskPercentage = 50%

// Expected results
shippingHold2x = 50.00 ✅
additionalHold = 25.00 ✅
insuranceHold = 20.00 ✅
totalInvestable = 45.00 ✅ (25 + 20)
totalNonInvestable = 50.00 ✅
```

**Assertions:**
- All calculations use 2 decimal precision
- No floating-point rounding errors
- Hold types classified correctly

#### 4.2 Fallout Calculation Math

**Test**: Verify 50/50 split calculations
```typescript
// Test data
shippingCost = 30.00
insuranceCost = 15.00
totalLoss = 100.00

// Expected results
totalCosts = 45.00 ✅ (30 + 15)
borrowerShare = 22.50 ✅ (45 × 0.5)
ownerShare = 22.50 ✅ (45 × 0.5)
investmentLoss = 55.00 ✅ (100 - 45)
borrowerCapitalLoss = 27.50 ✅ (55 × 0.5)
ownerCapitalLoss = 27.50 ✅ (55 × 0.5)
```

**Assertions:**
- All splits are exactly 50/50
- Investment loss is separate from shipping/insurance
- Total calculations are mathematically correct

#### 4.3 Tax Document Accuracy

**Test**: Verify tax document calculations
```typescript
// Verify capital loss report
borrowerCapitalLoss = 27.50 ✅
ownerCapitalLoss = 27.50 ✅
totalInvestmentLoss = 55.00 ✅

// Verify tax properties
reportable = true ✅
taxYear = 2024 ✅ (current year)
documentType = 'capital_loss_report' ✅
```

**Assertions:**
- All amounts match fallout calculations
- Tax year is current
- Document type is correct
- Reportable flag is true

---

### 5. Performance Benchmarks

#### 5.1 Response Time Targets

| Operation | Target | Max Acceptable |
|-----------|--------|----------------|
| Investment calculation | < 50ms | < 100ms |
| Hold creation | < 100ms | < 200ms |
| Tax document generation | < 2s | < 5s |
| Chat room creation | < 200ms | < 500ms |
| Slack sync | < 300ms | < 1s |
| Market monitoring | < 50ms | < 100ms |

#### 5.2 Throughput Targets

| System | Target | Max Acceptable |
|--------|--------|----------------|
| Concurrent users | 100 | 200 |
| API calls/second | 100 | 200 |
| Database queries | < 10ms | < 50ms |
| Memory usage | < 512MB | < 1GB |

#### 5.3 Load Testing

**Scenarios:**
- 50 users creating holds simultaneously
- 10 fallout scenarios triggered at once
- 20 chat rooms created concurrently
- 5 tax documents generated in parallel

**Success Criteria:**
- All operations complete successfully
- No timeouts or errors
- Performance within targets
- No memory leaks detected

---

### 6. Security & Compliance Tests

#### 6.1 PII Protection

**Test Cases:**
- Customer address blocked correctly
- Employee/CSR can see full address
- Unleash feature toggles work
- Role-based access enforced

**Assertions:**
- `customer.blockPII = true`
- `employee.blockPII = false`
- PII access logged in audit trail

#### 6.2 Financial Data Security

**Test Cases:**
- Wallet balances protected
- Investment amounts encrypted
- Transaction history audited
- Tax documents secured

**Assertions:**
- All financial data requires authentication
- Audit trails are immutable
- Encryption keys rotated regularly

---

### 7. Error Handling & Recovery

#### 7.1 Graceful Degradation

**Test Scenarios:**
- ShipStation API fails → fallback to manual
- Tax document generation fails → queue for retry
- Slack sync fails → log and retry later
- Investment robot fails → notify user

**Success Criteria:**
- System continues operating
- User receives clear error messages
- Errors logged for debugging
- Recovery procedures documented

#### 7.2 Rollback Mechanisms

**Test Scenarios:**
- Failed risky mode activation → funds returned
- Failed investment → hold released
- Failed fallout → funds protected
- Failed tax generation → retry queue

**Success Criteria:**
- No funds lost in failed operations
- Data consistency maintained
- Audit trail shows all attempts

---

## BVT Execution

### Pre-BVT Requirements
- [ ] All unit tests passing (> 90% coverage)
- [ ] All integration tests passing
- [ ] All PACT contracts validated
- [ ] Code review completed
- [ ] No critical linting errors
- [ ] Documentation updated

### BVT Execution Steps

1. **Prepare Environment** (2 minutes)
   - Clean build directories
   - Install dependencies
   - Reset test databases

2. **Run Build Tests** (5 minutes)
   - Compile TypeScript
   - Compile Kotlin
   - Validate Python
   - Check dependencies

3. **Run Service Integration Tests** (10 minutes)
   - All service-to-service tests
   - Verify contracts
   - Check data flow

4. **Run E2E Tests** (15 minutes)
   - Complete user journeys
   - Cross-plan integration
   - Complete workflows

5. **Run Performance Tests** (10 minutes)
   - Response time tests
   - Load tests
   - Memory profiling

6. **Run Security Tests** (5 minutes)
   - Vulnerability scan
   - Access control tests
   - PII protection tests

7. **Generate BVT Report** (5 minutes)
   - Summarize results
   - Document failures
   - Create tickets

**Total BVT Time: ~50 minutes**

---

## BVT Success Criteria

### Must Pass (Blocking)
- [ ] All builds successful
- [ ] All integration tests passing
- [ ] All PACT contracts verified
- [ ] No critical security vulnerabilities
- [ ] All calculations mathematically correct
- [ ] All chat room IDs unique
- [ ] All tax documents accurate

### Should Pass (Warning)
- [ ] Performance within targets (< 20% deviation)
- [ ] Code coverage > 80%
- [ ] Linting warnings < 10
- [ ] Documentation completeness > 90%

### Nice to Have (Info)
- [ ] Performance exceeds targets
- [ ] Code coverage > 90%
- [ ] Zero linting warnings
- [ ] 100% documentation complete

---

## BVT Failure Handling

### Automatic Actions
- Generate detailed failure report
- Create JIRA tickets for blocking issues
- Send notification to team
- Archive build artifacts for debugging

### Manual Actions
- Review failure report
- Investigate root cause
- Fix issues
- Re-run BVT

### Rollback Procedures
- Document current state
- Tag failed build
- Revert to last passing build
- Notify stakeholders

---

## BVT Reporting

### Report Structure
1. **Executive Summary**
   - Overall status (pass/fail)
   - Test execution time
   - Success rate

2. **Test Results by Category**
   - Build tests
   - Integration tests
   - E2E tests
   - Performance tests
   - Security tests

3. **Failed Tests**
   - Test name
   - Error message
   - Stack trace
   - Suggested fix

4. **Recommendations**
   - Immediate actions
   - Short-term fixes
   - Long-term improvements

### Delivery
- Email summary to team
- Post report to team chat
- Store in CI/CD artifacts
- Add to project documentation

---

## Continuous Integration

### BVT in CI/CD Pipeline

**Trigger Conditions:**
- Pull request created
- Code merged to main
- Scheduled daily run
- Manual trigger

**CI Pipeline:**
```yaml
1. Checkout code
2. Install dependencies
3. Run unit tests
4. Run build tests ← BVT Phase 1
5. Run integration tests ← BVT Phase 2
6. Run E2E tests ← BVT Phase 3
7. Run PACT tests ← BVT Phase 4
8. Run performance tests ← BVT Phase 5
9. Run security scan ← BVT Phase 6
10. Generate report
11. Deploy if passing
```

**Failure Actions:**
- Block merge if BVT fails
- Send notification to team
- Create failure report
- Suggest rollback

---

## BVT Maintenance

### Regular Updates
- Update test data monthly
- Refresh mocks as services evolve
- Adjust performance targets
- Update security requirements

### Test Coverage Monitoring
- Track code coverage trend
- Monitor test execution time
- Review flaky tests
- Update as new features added

### Documentation
- Keep BVT spec current
- Document test environment setup
- Maintain troubleshooting guide
- Update as system evolves

