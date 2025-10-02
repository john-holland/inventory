# PACT Testing Guide for Cabin Feature

This guide explains how to run and maintain PACT tests for the Cabin feature with AirBnB API integration.

## Overview

The Cabin feature includes comprehensive PACT testing that mocks the AirBnB API and tests the integration between the frontend and backend services. The tests ensure that the cabin creation, item takeout, chat integration, and calendar integration work correctly.

## Test Structure

### 1. PACT Contract Tests (`src/pacts/cabin-airbnb-provider.pact.js`)
- Tests the contract between the frontend and AirBnB API
- Mocks AirBnB API responses
- Tests error handling (404, rate limiting, network errors)
- Tests cabin creation flow with AirBnB integration
- Tests chat and calendar integration

### 2. Unit Tests
- **CabinPage Component** (`src/components/__tests__/CabinPage.test.js`)
- **CabinService** (`src/services/__tests__/CabinService.test.js`)
- **MockAirbnbService** (`src/services/__tests__/MockAirbnbService.test.js`)

### 3. Mock Services
- **MockAirbnbService** (`src/services/MockAirbnbService.ts`)
  - Provides realistic AirBnB API responses
  - Simulates API delays and errors
  - Supports filtering and searching
  - Includes rate limiting simulation

## Running Tests

### Run All Tests
```bash
npm test
```

### Run PACT Tests Only
```bash
npm run pact:cabin
```

### Run PACT Tests and Publish to Broker
```bash
npm run pact:cabin:publish
```

### Run Specific Test Files
```bash
# Run CabinPage tests
npm test -- src/components/__tests__/CabinPage.test.js

# Run CabinService tests
npm test -- src/services/__tests__/CabinService.test.js

# Run MockAirbnbService tests
npm test -- src/services/__tests__/MockAirbnbService.test.js
```

## Test Configuration

### Jest Configuration (`jest.config.js`)
- Test environment: Node.js
- Timeout: 30 seconds
- Coverage collection enabled
- PACT-specific setup

### Test Setup (`src/setupTests.js`)
- Mocks fetch for PACT tests
- Reduces console noise during tests
- Sets up test environment variables

## PACT Contract Details

### AirBnB API Mock
- **Port**: 4001
- **Provider**: `airbnb-api-mock`
- **Consumer**: `inventory-frontend`

### Test Scenarios

#### 1. AirBnB API Integration
- ✅ Fetch listing details
- ✅ Handle listing not found (404)
- ✅ Handle rate limiting (429)
- ✅ Handle network errors

#### 2. Cabin Creation Flow
- ✅ Create cabin with AirBnB integration
- ✅ Calculate costs correctly
- ✅ Auto-create chat room
- ✅ Auto-create calendar event

#### 3. Item Takeout Flow
- ✅ Record item takeout
- ✅ Calculate hold amounts
- ✅ Track return dates
- ✅ Handle overdue items

#### 4. Chat Integration
- ✅ Create cabin chat room
- ✅ Send welcome messages
- ✅ Notify on item takeouts

#### 5. Calendar Integration
- ✅ Create calendar events
- ✅ Send calendar invites
- ✅ Generate iCal attachments

## Mock Data

### AirBnB Listings
The MockAirbnbService includes three sample listings:

1. **Cozy Cabin in the Woods** (`airbnb_12345`)
   - Price: $150/night
   - Max guests: 8
   - Location: Mountain View, CA

2. **Modern Urban Loft** (`airbnb_67890`)
   - Price: $200/night
   - Max guests: 6
   - Location: San Francisco, CA

3. **Beach House Retreat** (`airbnb_11111`)
   - Price: $300/night
   - Max guests: 10
   - Location: Santa Monica, CA

### Test Users
- User One (`user1`)
- User Two (`user2`)
- Current User (`current-user`)

### Test Items
- Demo Item 1 (`item1`) - Deposit: $50
- Demo Item 2 (`item2`) - Deposit: $75

## Error Scenarios

### AirBnB API Errors
- **404 Not Found**: Listing doesn't exist
- **429 Rate Limited**: Too many requests
- **Network Error**: Connection issues

### Cabin Creation Errors
- Invalid AirBnB listing ID
- Missing required fields
- User not found
- Item not available

### Item Takeout Errors
- Cabin not found
- Item not in cabin
- User not authorized
- Invalid return date

## Best Practices

### 1. Test Isolation
- Each test is independent
- Mocks are reset between tests
- No shared state between tests

### 2. Realistic Data
- Use realistic AirBnB listing data
- Include proper error responses
- Simulate real API delays

### 3. Comprehensive Coverage
- Test happy path scenarios
- Test error conditions
- Test edge cases
- Test integration points

### 4. Maintainable Tests
- Clear test descriptions
- Organized test structure
- Reusable mock data
- Proper cleanup

## Troubleshooting

### Common Issues

#### 1. Port Conflicts
If port 4001 is already in use:
```bash
# Find process using port 4001
lsof -i :4001

# Kill the process
kill -9 <PID>
```

#### 2. PACT Broker Connection
If PACT broker is not available:
```bash
# Run tests without publishing
npm run pact:cabin

# Or set local broker URL
export PACT_BROKER_URL=http://localhost:9292
npm run pact:cabin:publish
```

#### 3. Test Timeouts
If tests are timing out:
- Check network connectivity
- Verify mock services are running
- Increase timeout in jest.config.js

#### 4. Mock Data Issues
If mock data is not working:
- Verify MockAirbnbService is properly imported
- Check test environment variables
- Ensure mocks are reset between tests

## Continuous Integration

### GitHub Actions
```yaml
- name: Run PACT Tests
  run: |
    cd frontend
    npm install
    npm run pact:cabin
    
- name: Publish PACT Contracts
  run: |
    cd frontend
    npm run pact:cabin:publish
  env:
    PACT_BROKER_URL: ${{ secrets.PACT_BROKER_URL }}
    PACT_BROKER_TOKEN: ${{ secrets.PACT_BROKER_TOKEN }}
```

### Local Development
```bash
# Run tests before committing
npm run pact:cabin

# Run all tests
npm test

# Run with coverage
npm test -- --coverage
```

## Monitoring

### Test Results
- PACT files are generated in `pacts/` directory
- Test logs are available in `logs/` directory
- Coverage reports in `coverage/` directory

### PACT Broker
- View contracts at PACT broker URL
- Monitor contract changes
- Track consumer-provider compatibility

## Contributing

### Adding New Tests
1. Create test file in appropriate directory
2. Follow existing naming conventions
3. Include comprehensive test cases
4. Update this guide if needed

### Updating Mock Data
1. Modify MockAirbnbService
2. Update test expectations
3. Verify all tests pass
4. Update documentation

### PACT Contract Changes
1. Update contract tests
2. Run PACT tests
3. Publish to broker
4. Notify provider teams

## Resources

- [PACT Documentation](https://docs.pact.io/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [AirBnB API Documentation](https://www.airbnb.com/partner/help/article/2908)

