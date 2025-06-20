#!/usr/bin/env node

/**
 * Enhanced Investment System Test Script
 * Tests the new investment pool system, user addresses, and enhanced shipping routes
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
const TEST_USER_ID = 1;

// Test data
const testAddressData = {
  streetAddress1: '123 Main St',
  streetAddress2: 'Apt 4B',
  city: 'New York',
  state: 'NY',
  postalCode: '10001',
  country: 'US',
  phone: '+1-555-123-4567',
  contactName: 'John Doe',
  shippingInstructions: 'Leave at front desk',
  accessCode: '1234',
  businessHours: '9 AM - 5 PM',
  specialRequirements: 'Signature required'
};

const testPoolSettings = {
  targetBalance: 1000,
  autoReinvest: true,
  riskProfile: 'moderate',
  metadata: {
    poolNotes: 'Test investment pool',
    investmentStrategy: 'balanced'
  }
};

async function testEnhancedInvestmentSystem() {
  console.log('🚀 Testing Enhanced Investment System...\n');

  try {
    // Test 1: Create User Addresses
    console.log('📮 Test 1: Creating User Addresses');
    const address1 = await createAddress('shipping', testAddressData);
    const address2 = await createAddress('billing', {
      ...testAddressData,
      streetAddress1: '456 Business Ave',
      city: 'Los Angeles',
      state: 'CA',
      postalCode: '90210'
    });
    console.log('✅ Addresses created successfully\n');

    // Test 2: Get Addresses by User
    console.log('📋 Test 2: Getting Addresses by User');
    const addresses = await getAddressesByUser();
    console.log(`✅ Found ${addresses.length} addresses for user\n`);

    // Test 3: Set Default Address
    console.log('⭐ Test 3: Setting Default Address');
    await setDefaultAddress(address1.id);
    console.log('✅ Default address set successfully\n');

    // Test 4: Calculate Shipping Cost
    console.log('💰 Test 4: Calculating Shipping Cost');
    const shippingCost = await calculateShippingCost(address1.id, address2.id);
    console.log(`✅ Shipping cost calculated: $${shippingCost.totalCost}\n`);

    // Test 5: Create Investment Pools
    console.log('🏦 Test 5: Creating Investment Pools');
    const individualPool = await createInvestmentPool('individual', 500, testPoolSettings);
    const herdPool = await createInvestmentPool('herd', 300, testPoolSettings);
    const automaticPool = await createInvestmentPool('automatic', 200, testPoolSettings);
    console.log('✅ Investment pools created successfully\n');

    // Test 6: Add Funds to Pools
    console.log('💵 Test 6: Adding Funds to Pools');
    await addFundsToPool(individualPool.id, 250);
    await addFundsToPool(herdPool.id, 150);
    await addFundsToPool(automaticPool.id, 100);
    console.log('✅ Funds added to pools successfully\n');

    // Test 7: Calculate Returns
    console.log('📈 Test 7: Calculating Returns');
    const individualReturns = await calculateReturns(individualPool.id);
    const herdReturns = await calculateReturns(herdPool.id);
    const automaticReturns = await calculateReturns(automaticPool.id);
    console.log(`✅ Individual returns: $${individualReturns.returnAmount}`);
    console.log(`✅ Herd returns: $${herdReturns.returnAmount}`);
    console.log(`✅ Automatic returns: $${automaticReturns.returnAmount}\n`);

    // Test 8: Get Herd Performance
    console.log('🐑 Test 8: Getting Herd Performance');
    const herdPerformance = await getHerdPerformance();
    console.log(`✅ Herd performance: ${herdPerformance.participantCount} participants, ${herdPerformance.averageReturnRate} average return rate\n`);

    // Test 9: Get Pool Statistics
    console.log('📊 Test 9: Getting Pool Statistics');
    const poolStats = await getPoolStatistics();
    console.log(`✅ Pool statistics: ${poolStats.totalPools} total pools, $${poolStats.totalInvested} total invested\n`);

    // Test 10: Get Address Statistics
    console.log('📊 Test 10: Getting Address Statistics');
    const addressStats = await getAddressStatistics();
    console.log(`✅ Address statistics: ${addressStats.totalAddresses} total addresses, ${addressStats.verificationRate}% verification rate\n`);

    // Test 11: Process Automatic Rebalancing
    console.log('⚖️ Test 11: Processing Automatic Rebalancing');
    const rebalanceResult = await processAutomaticRebalancing();
    console.log(`✅ Automatic rebalancing: ${rebalanceResult.processed} of ${rebalanceResult.total} pools processed\n`);

    // Test 12: Get Available Address Types
    console.log('🏷️ Test 12: Getting Available Address Types');
    const addressTypes = await getAddressTypes();
    console.log(`✅ Available address types: ${Object.keys(addressTypes).join(', ')}\n`);

    // Test 13: Get Shipping Methods
    console.log('🚚 Test 13: Getting Shipping Methods');
    const shippingMethods = await getShippingMethods();
    console.log(`✅ Available shipping methods: ${Object.keys(shippingMethods).join(', ')}\n`);

    // Test 14: Get Carriers
    console.log('📦 Test 14: Getting Carriers');
    const carriers = await getCarriers();
    console.log(`✅ Available carriers: ${Object.keys(carriers).join(', ')}\n`);

    console.log('🎉 All Enhanced Investment System tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- ✅ User address management with multiple addresses per user');
    console.log('- ✅ Investment pools (individual, herd, automatic)');
    console.log('- ✅ Enhanced shipping routes with address associations');
    console.log('- ✅ Automatic investment rebalancing based on water level');
    console.log('- ✅ Herd investment with higher returns and water level requirements');
    console.log('- ✅ Shipping cost calculation between addresses');
    console.log('- ✅ Comprehensive statistics and analytics');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    process.exit(1);
  }
}

// Helper functions
async function createAddress(addressType, addressData) {
  const response = await axios.post(`${BASE_URL}/user-addresses/addresses`, {
    userId: TEST_USER_ID,
    addressType,
    addressData
  });
  return response.data.data;
}

async function getAddressesByUser() {
  const response = await axios.get(`${BASE_URL}/user-addresses/users/${TEST_USER_ID}/addresses`);
  return response.data.data;
}

async function setDefaultAddress(addressId) {
  const response = await axios.post(`${BASE_URL}/user-addresses/addresses/${addressId}/default`, {
    userId: TEST_USER_ID
  });
  return response.data.data;
}

async function calculateShippingCost(fromAddressId, toAddressId) {
  const response = await axios.post(`${BASE_URL}/user-addresses/shipping/calculate-cost`, {
    fromAddressId,
    toAddressId,
    shippingMethod: 'standard'
  });
  return response.data.data;
}

async function createInvestmentPool(poolType, initialAmount, settings) {
  const response = await axios.post(`${BASE_URL}/investment-pools/pools`, {
    userId: TEST_USER_ID,
    poolType,
    initialAmount,
    settings
  });
  return response.data.data;
}

async function addFundsToPool(poolId, amount) {
  const response = await axios.post(`${BASE_URL}/investment-pools/pools/${poolId}/funds`, {
    amount,
    source: 'wallet'
  });
  return response.data.data;
}

async function calculateReturns(poolId) {
  const response = await axios.get(`${BASE_URL}/investment-pools/pools/${poolId}/returns`);
  return response.data.data;
}

async function getHerdPerformance() {
  const response = await axios.get(`${BASE_URL}/investment-pools/herd/performance`);
  return response.data.data;
}

async function getPoolStatistics() {
  const response = await axios.get(`${BASE_URL}/investment-pools/statistics`);
  return response.data.data;
}

async function getAddressStatistics() {
  const response = await axios.get(`${BASE_URL}/user-addresses/addresses/statistics`);
  return response.data.data;
}

async function processAutomaticRebalancing() {
  const response = await axios.post(`${BASE_URL}/investment-pools/automatic/rebalance`);
  return response.data.data;
}

async function getAddressTypes() {
  const response = await axios.get(`${BASE_URL}/user-addresses/addresses/types`);
  return response.data.data;
}

async function getShippingMethods() {
  const response = await axios.get(`${BASE_URL}/user-addresses/shipping/methods`);
  return response.data.data;
}

async function getCarriers() {
  const response = await axios.get(`${BASE_URL}/user-addresses/shipping/carriers`);
  return response.data.data;
}

// Run the test
if (require.main === module) {
  testEnhancedInvestmentSystem().catch(console.error);
}

module.exports = { testEnhancedInvestmentSystem }; 