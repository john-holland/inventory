/**
 * Simple test script for the waitlist system
 * Run with: node test-waitlist.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testWaitlistSystem() {
  console.log('🧪 Testing Waitlist System...\n');

  try {
    // Test 1: Apply to waitlist
    console.log('1. Testing waitlist application...');
    const applicationData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890'
    };

    const applyResponse = await axios.post(`${BASE_URL}/api/waitlist/apply`, applicationData);
    console.log('✅ Application submitted:', applyResponse.data.message);
    console.log('   Status:', applyResponse.data.data.status);
    console.log('   Auto-approved:', applyResponse.data.data.autoApproved);

    // Test 2: Check waitlist status
    console.log('\n2. Testing waitlist status check...');
    const statusResponse = await axios.get(`${BASE_URL}/api/waitlist/status/john.doe@example.com`);
    console.log('✅ Status retrieved:', statusResponse.data.data.status);

    // Test 3: Get waitlist statistics (admin endpoint)
    console.log('\n3. Testing waitlist statistics...');
    const statsResponse = await axios.get(`${BASE_URL}/api/waitlist/admin/stats`);
    console.log('✅ Statistics retrieved:');
    console.log('   Total applications:', statsResponse.data.data.total);
    console.log('   Pending:', statsResponse.data.data.pending);
    console.log('   Approved:', statsResponse.data.data.approved);
    console.log('   Approval rate:', statsResponse.data.data.approvalRate + '%');

    // Test 4: Get waitlist entries (admin endpoint)
    console.log('\n4. Testing waitlist entries retrieval...');
    const entriesResponse = await axios.get(`${BASE_URL}/api/waitlist/admin/entries?limit=5`);
    console.log('✅ Entries retrieved:', entriesResponse.data.data.length, 'entries');

    // Test 5: Add whitelist entry (admin endpoint)
    console.log('\n5. Testing whitelist entry addition...');
    const whitelistData = {
      email: 'trusted@company.com',
      firstName: 'Trusted',
      lastName: 'User',
      type: 'email',
      reason: 'Trusted company employee'
    };

    const whitelistResponse = await axios.post(`${BASE_URL}/api/waitlist/admin/whitelist`, whitelistData);
    console.log('✅ Whitelist entry added:', whitelistResponse.data.message);

    // Test 6: Get whitelist entries (admin endpoint)
    console.log('\n6. Testing whitelist entries retrieval...');
    const whitelistEntriesResponse = await axios.get(`${BASE_URL}/api/waitlist/admin/whitelist`);
    console.log('✅ Whitelist entries retrieved:', whitelistEntriesResponse.data.data.length, 'entries');

    // Test 7: Test whitelisted user application
    console.log('\n7. Testing whitelisted user application...');
    const whitelistedApplicationData = {
      firstName: 'Trusted',
      lastName: 'User',
      email: 'trusted@company.com',
      phone: '+1987654321'
    };

    const whitelistedResponse = await axios.post(`${BASE_URL}/api/waitlist/apply`, whitelistedApplicationData);
    console.log('✅ Whitelisted application:', whitelistedResponse.data.message);
    console.log('   Status:', whitelistedResponse.data.data.status);
    console.log('   Auto-approved:', whitelistedResponse.data.data.autoApproved);

    console.log('\n🎉 All waitlist tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 404) {
      console.log('\n💡 Make sure the server is running on port 3000');
      console.log('   Run: npm start or npm run dev');
    }
  }
}

// Test constants system
async function testConstantsSystem() {
  console.log('\n🔧 Testing Constants System...\n');

  try {
    // Test constants endpoint (if available)
    console.log('1. Testing constants validation...');
    
    // Import constants directly
    const { getCoefficient, validateCoefficients } = require('./server/config/ConstantMarketCoefficients');
    
    // Test getting coefficients
    const consumerShare = getCoefficient('REVENUE.CONSUMER_SHARE');
    const platformShare = getCoefficient('REVENUE.PLATFORM_SHARE');
    const serverImpact = getCoefficient('WATER_LEVEL.BILL_CATEGORY_IMPACT.SERVER');
    
    console.log('✅ Constants retrieved:');
    console.log('   Consumer Share:', consumerShare);
    console.log('   Platform Share:', platformShare);
    console.log('   Server Bill Impact:', serverImpact);
    
    // Test validation
    const validation = validateCoefficients();
    console.log('✅ Constants validation:', validation.valid ? 'PASSED' : 'FAILED');
    
    if (!validation.valid) {
      console.log('   Errors:', validation.errors);
    }

    console.log('\n🎉 Constants system test completed successfully!');

  } catch (error) {
    console.error('❌ Constants test failed:', error.message);
  }
}

// Run tests
async function runTests() {
  console.log('🚀 Starting Inventory System Tests...\n');
  
  await testConstantsSystem();
  await testWaitlistSystem();
  
  console.log('\n✨ All tests completed!');
  console.log('\n📝 Next steps:');
  console.log('   1. Visit http://localhost:3000/waitlist.html to see the waitlist form');
  console.log('   2. Visit http://localhost:3000/admin-waitlist.html to access the admin interface');
  console.log('   3. Check the API documentation at http://localhost:3000/api/docs');
}

// Check if server is running
async function checkServer() {
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Server is running and healthy');
    return true;
  } catch (error) {
    console.log('❌ Server is not running or not accessible');
    console.log('   Please start the server first: npm start');
    return false;
  }
}

// Main execution
async function main() {
  const serverRunning = await checkServer();
  
  if (serverRunning) {
    await runTests();
  } else {
    console.log('\n💡 To start the server:');
    console.log('   1. Make sure all dependencies are installed: npm install');
    console.log('   2. Set up your environment variables: cp env.example .env');
    console.log('   3. Start the server: npm start');
    console.log('   4. Run this test again: node test-waitlist.js');
  }
}

main().catch(console.error); 