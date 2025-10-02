# Charity Drop Shipping PACT Integration Guide

This guide explains how PACT tests ensure proper convergence between charity API features and the drop shipping API bridge.

## Overview

The PACT tests verify that the charity lending service and drop shipping API bridge work together correctly, ensuring:

- **Feature Toggle Integration**: Charity features can be enabled/disabled without breaking functionality
- **API Convergence**: Both services use compatible data structures and error handling
- **Compliance Verification**: Safety checks work across both services
- **Error Handling**: Graceful degradation when features are disabled

## Test Structure

### Consumer Tests (`charity-drop-shipping.pact.js`)

Tests the charity lending service as a consumer of the drop shipping API bridge:

```javascript
describe('Charity Features Enabled', () => {
  it('should successfully connect APIs when charity features are enabled')
  it('should allow charity item lookup through drop shipping APIs')
  it('should place charity orders through official channels')
  it('should create charity lending requests with drop shipping integration')
  it('should process charity donations through drop shipping')
});
```

### Provider Tests (`charity-drop-shipping-provider.pact.js`)

Tests the drop shipping API bridge as a provider for the charity lending service:

```javascript
describe('Integration Test Scenarios', () => {
  it('should handle charity features enabled state correctly')
  it('should provide compliance reports in expected format')
  it('should handle charity item lookups correctly')
  it('should integrate charity lending service with drop shipping')
});
```

## Key Integration Points

### 1. Feature Toggle Convergence

**Consumer Expectation:**
```javascript
// Charity service expects API bridge to respect feature toggle
const result = await dropShippingBridge.connect();
expect(result).toBe(true); // When enabled
expect(result).toBe(false); // When disabled
```

**Provider Implementation:**
```javascript
// API bridge must implement toggle functionality
setCharityFeaturesEnabled(enabled: boolean): void
isCharityFeaturesEnabled(): boolean
```

### 2. API Response Format Convergence

**Consumer Expectation:**
```javascript
// Charity service expects specific response format
const itemInfo = await dropShippingBridge.getItemInfo(platform, itemId);
expect(itemInfo).toHaveProperty('platform');
expect(itemInfo).toHaveProperty('itemId');
expect(itemInfo).toHaveProperty('available');
```

**Provider Implementation:**
```javascript
// API bridge must return compatible format
return {
  platform: 'amazon',
  itemId: 'B08N5WRWNW',
  title: 'Test Item',
  price: 25.99,
  available: true,
  lastChecked: '2024-01-01T00:00:00Z'
};
```

### 3. Error Handling Convergence

**Consumer Expectation:**
```javascript
// Charity service expects specific error messages
try {
  await dropShippingBridge.getItemInfo('amazon', 'item');
} catch (error) {
  expect(error.message).toContain('charity features disabled');
}
```

**Provider Implementation:**
```javascript
// API bridge must throw compatible errors
if (!this.charityFeaturesEnabled) {
  throw new Error('API Bridge not connected or charity features disabled');
}
```

### 4. Compliance Report Convergence

**Consumer Expectation:**
```javascript
// Charity service expects compliance report structure
const report = await dropShippingBridge.getComplianceReport();
expect(report).toHaveProperty('charityFeaturesEnabled');
expect(report).toHaveProperty('overall');
expect(report.overall).toHaveProperty('compliant');
```

**Provider Implementation:**
```javascript
// API bridge must provide compatible compliance data
return {
  charityFeaturesEnabled: true,
  overall: {
    noInterference: true,
    usingOfficialChannels: true,
    compliant: true
  }
};
```

## Running the Tests

### Full Test Suite
```bash
npm run pact:charity
```

### Publish Only
```bash
npm run pact:charity:publish
```

### Specific Scenario
```bash
node scripts/run-charity-pact-tests.js --scenario "Charity Features Enabled"
```

## Test Scenarios

### 1. Charity Features Enabled
- **Purpose**: Verify integration when charity features are active
- **Tests**: API connections, item lookups, order placement, lending requests
- **Expected**: All operations succeed with proper data flow

### 2. Charity Features Disabled
- **Purpose**: Verify graceful degradation when features are disabled
- **Tests**: API connection rejection, operation blocking
- **Expected**: Clear error messages, no API interference

### 3. Compliance and Safety
- **Purpose**: Verify safety measures work across both services
- **Tests**: No interference checks, compliance reports, API testing
- **Expected**: All safety checks pass, compliance verified

### 4. Error Handling
- **Purpose**: Verify error handling works consistently
- **Tests**: Rate limiting, invalid credentials, network issues
- **Expected**: Graceful error handling with clear messages

### 5. Provider Verification
- **Purpose**: Verify provider implementation matches consumer expectations
- **Tests**: Data structure validation, method availability
- **Expected**: Provider implements all expected interfaces

### 6. Integration Scenarios
- **Purpose**: Verify end-to-end integration scenarios
- **Tests**: Complete workflows, state management, performance
- **Expected**: Smooth integration with reasonable performance

## Convergence Verification

### Data Structure Convergence
The tests verify that both services use compatible data structures:

```javascript
// Both services must agree on item structure
interface ItemInfo {
  platform: string;
  itemId: string;
  title: string;
  price: number;
  available: boolean;
  lastChecked: string;
}
```

### Method Signature Convergence
The tests verify that method signatures are compatible:

```javascript
// Both services must agree on method signatures
getItemInfo(platform: string, itemId: string): Promise<ItemInfo>
placeCharityOrder(platform: string, itemId: string, quantity: number, charityAddress: string): Promise<OrderResult>
```

### Error Handling Convergence
The tests verify that error handling is consistent:

```javascript
// Both services must use compatible error types
class CharityAPIError extends Error {
  constructor(message: string, public code: string) {
    super(message);
  }
}
```

### State Management Convergence
The tests verify that state management works across services:

```javascript
// Both services must handle feature toggle state consistently
setCharityFeaturesEnabled(enabled: boolean): void
isCharityFeaturesEnabled(): boolean
```

## Continuous Integration

### Pre-commit Hooks
```bash
# Run charity PACT tests before committing
npm run pact:charity
```

### CI Pipeline
```yaml
# Example CI configuration
- name: Run Charity PACT Tests
  run: npm run pact:charity
  
- name: Publish PACTs
  run: npm run pact:charity:publish
  if: success()
```

### Deployment Gates
- All PACT tests must pass before deployment
- Provider verification must succeed
- No breaking changes to integration contracts

## Monitoring and Alerts

### PACT Broker Integration
- Monitor PACT verification results
- Alert on contract violations
- Track integration health over time

### Metrics to Watch
- PACT test success rate
- Provider verification time
- Contract change frequency
- Integration failure rate

## Troubleshooting

### Common Issues

1. **Feature Toggle Mismatch**
   - **Symptom**: Tests fail when toggling charity features
   - **Solution**: Verify both services implement toggle consistently

2. **Data Structure Mismatch**
   - **Symptom**: PACT verification fails on response format
   - **Solution**: Update provider to match consumer expectations

3. **Error Message Mismatch**
   - **Symptom**: Error handling tests fail
   - **Solution**: Standardize error messages across services

4. **Performance Issues**
   - **Symptom**: Tests timeout or take too long
   - **Solution**: Optimize API calls and add timeouts

### Debug Commands
```bash
# Run with verbose output
node scripts/run-charity-pact-tests.js --verbose

# Run specific test with debugging
DEBUG=pact* npm run pact:charity

# Check PACT broker status
npx @pact-foundation/pact-cli broker can-i-deploy --pacticipant charity-lending-service --version 1.0.0
```

## Best Practices

1. **Keep Contracts Simple**: Focus on essential integration points
2. **Version Carefully**: Use semantic versioning for contract changes
3. **Test Early**: Run PACT tests during development, not just CI
4. **Monitor Continuously**: Watch for integration drift over time
5. **Document Changes**: Update this guide when contracts change

## Future Enhancements

- **Automated Contract Generation**: Generate contracts from TypeScript interfaces
- **Visualization**: Add PACT broker dashboard for integration health
- **Performance Testing**: Add performance contracts for response times
- **Security Testing**: Add security-focused PACT tests
- **Load Testing**: Add load testing contracts for high-traffic scenarios 