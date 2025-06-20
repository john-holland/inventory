#!/usr/bin/env node

/**
 * Enhanced System Test Script
 * 
 * This script tests the new enhanced inventory system including:
 * - Hold-based investment model
 * - Meta marketplace items
 * - Enhanced revenue model with configurable coefficients
 * - Waitlist and whitelist system
 * - Disbursement processing
 * 
 * Usage: node test-enhanced-system.js
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
const TEST_USER = {
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  phone: '+1234567890'
};

const TEST_ITEM = {
  title: 'Test Meta Marketplace Item',
  description: 'A test item for the meta marketplace',
  price: 99.99,
  category: 'Electronics',
  quantity: 1,
  condition: 'new',
  location: 'Test Location',
  shippingCost: 10.00,
  shippingMethod: 'standard',
  tags: ['test', 'electronics', 'meta']
};

const TEST_HOLD = {
  userId: 1,
  itemId: 1,
  shippingRouteId: 1,
  amount: 200.00,
  metadata: {
    holdReason: 'Test hold for investment',
    notes: 'Testing the new hold system'
  }
};

class EnhancedSystemTester {
  constructor() {
    this.testResults = [];
    this.serverRunning = false;
  }

  async log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`${prefix} [${timestamp}] ${message}`);
  }

  async testServerConnection() {
    try {
      this.log('Testing server connection...');
      const response = await axios.get(`${BASE_URL.replace('/api', '')}/health`);
      
      if (response.status === 200) {
        this.serverRunning = true;
        this.log('Server is running and healthy', 'success');
        return true;
      } else {
        this.log('Server responded but not healthy', 'error');
        return false;
      }
    } catch (error) {
      this.log(`Server connection failed: ${error.message}`, 'error');
      this.log('Make sure the server is running on port 3000', 'error');
      return false;
    }
  }

  async testConstantsSystem() {
    try {
      this.log('Testing configurable constants system...');
      
      const response = await axios.get(`${BASE_URL}/docs`);
      
      if (response.status === 200) {
        this.log('Constants system is accessible', 'success');
        
        // Test specific coefficients
        const constants = response.data;
        if (constants.revenueModel) {
          this.log('Revenue model configuration loaded', 'success');
        }
        
        return true;
      } else {
        this.log('Constants system not accessible', 'error');
        return false;
      }
    } catch (error) {
      this.log(`Constants system test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testWaitlistSystem() {
    try {
      this.log('Testing waitlist system...');
      
      // Test waitlist application
      const applyResponse = await axios.post(`${BASE_URL}/waitlist/apply`, TEST_USER);
      
      if (applyResponse.status === 201) {
        this.log('Waitlist application submitted successfully', 'success');
        
        // Test status check
        const statusResponse = await axios.get(`${BASE_URL}/waitlist/status/${TEST_USER.email}`);
        
        if (statusResponse.status === 200) {
          this.log('Waitlist status check working', 'success');
        }
        
        return true;
      } else {
        this.log('Waitlist application failed', 'error');
        return false;
      }
    } catch (error) {
      this.log(`Waitlist system test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testMetaMarketplaceSystem() {
    try {
      this.log('Testing meta marketplace system...');
      
      // Test creating a meta marketplace item
      const createResponse = await axios.post(`${BASE_URL}/meta-marketplace/items`, {
        userId: 1,
        ...TEST_ITEM
      });
      
      if (createResponse.status === 201) {
        this.log('Meta marketplace item created successfully', 'success');
        
        const itemId = createResponse.data.data.id;
        
        // Test searching items
        const searchResponse = await axios.get(`${BASE_URL}/meta-marketplace/items/search?category=Electronics`);
        
        if (searchResponse.status === 200) {
          this.log('Meta marketplace search working', 'success');
        }
        
        // Test getting alternative items
        const alternativesResponse = await axios.get(`${BASE_URL}/meta-marketplace/items/alternatives/123`);
        
        if (alternativesResponse.status === 200) {
          this.log('Alternative items system working', 'success');
        }
        
        // Test item statistics
        const statsResponse = await axios.get(`${BASE_URL}/meta-marketplace/items/statistics`);
        
        if (statsResponse.status === 200) {
          this.log('Meta marketplace statistics working', 'success');
        }
        
        return true;
      } else {
        this.log('Meta marketplace item creation failed', 'error');
        return false;
      }
    } catch (error) {
      this.log(`Meta marketplace system test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testHoldSystem() {
    try {
      this.log('Testing hold system...');
      
      // Test creating a hold
      const createResponse = await axios.post(`${BASE_URL}/holds`, TEST_HOLD);
      
      if (createResponse.status === 201) {
        this.log('Hold created successfully', 'success');
        
        const holdId = createResponse.data.data.id;
        
        // Test getting holds by user
        const userHoldsResponse = await axios.get(`${BASE_URL}/users/${TEST_HOLD.userId}/holds`);
        
        if (userHoldsResponse.status === 200) {
          this.log('User holds retrieval working', 'success');
        }
        
        // Test getting holds by item
        const itemHoldsResponse = await axios.get(`${BASE_URL}/items/${TEST_HOLD.itemId}/holds`);
        
        if (itemHoldsResponse.status === 200) {
          this.log('Item holds retrieval working', 'success');
        }
        
        // Test hold statistics
        const statsResponse = await axios.get(`${BASE_URL}/holds/statistics`);
        
        if (statsResponse.status === 200) {
          this.log('Hold statistics working', 'success');
        }
        
        // Test releasing a hold
        const releaseResponse = await axios.post(`${BASE_URL}/holds/${holdId}/release`, {
          userId: TEST_HOLD.userId,
          releaseReason: 'Test release',
          metadata: {
            releaseNotes: 'Testing hold release functionality'
          }
        });
        
        if (releaseResponse.status === 200) {
          this.log('Hold release working', 'success');
        }
        
        return true;
      } else {
        this.log('Hold creation failed', 'error');
        return false;
      }
    } catch (error) {
      this.log(`Hold system test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testEnhancedRevenueModel() {
    try {
      this.log('Testing enhanced revenue model...');
      
      // Test getting investment returns calculation
      const investmentResponse = await axios.get(`${BASE_URL}/consumer-investments/performance`);
      
      if (investmentResponse.status === 200) {
        this.log('Investment performance tracking working', 'success');
      }
      
      // Test water limit analytics
      const waterLimitResponse = await axios.get(`${BASE_URL}/water-limits/summary`);
      
      if (waterLimitResponse.status === 200) {
        this.log('Water limit system working', 'success');
      }
      
      // Test billing analytics
      const billingResponse = await axios.get(`${BASE_URL}/inventory/analytics/holds`);
      
      if (billingResponse.status === 200) {
        this.log('Hold analytics working', 'success');
      }
      
      return true;
    } catch (error) {
      this.log(`Enhanced revenue model test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testAdminEndpoints() {
    try {
      this.log('Testing admin endpoints...');
      
      // Test waitlist admin endpoints
      const waitlistEntriesResponse = await axios.get(`${BASE_URL}/admin/waitlist/entries`);
      
      if (waitlistEntriesResponse.status === 200) {
        this.log('Waitlist admin endpoints working', 'success');
      }
      
      // Test whitelist admin endpoints
      const whitelistEntriesResponse = await axios.get(`${BASE_URL}/admin/whitelist/entries`);
      
      if (whitelistEntriesResponse.status === 200) {
        this.log('Whitelist admin endpoints working', 'success');
      }
      
      // Test hold admin endpoints
      const holdExpiryResponse = await axios.post(`${BASE_URL}/holds/process-expired`);
      
      if (holdExpiryResponse.status === 200) {
        this.log('Hold admin endpoints working', 'success');
      }
      
      return true;
    } catch (error) {
      this.log(`Admin endpoints test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async runAllTests() {
    this.log('🚀 Starting Enhanced System Tests', 'info');
    this.log('================================', 'info');
    
    const tests = [
      { name: 'Server Connection', test: () => this.testServerConnection() },
      { name: 'Constants System', test: () => this.testConstantsSystem() },
      { name: 'Waitlist System', test: () => this.testWaitlistSystem() },
      { name: 'Meta Marketplace System', test: () => this.testMetaMarketplaceSystem() },
      { name: 'Hold System', test: () => this.testHoldSystem() },
      { name: 'Enhanced Revenue Model', test: () => this.testEnhancedRevenueModel() },
      { name: 'Admin Endpoints', test: () => this.testAdminEndpoints() }
    ];
    
    let passedTests = 0;
    let totalTests = tests.length;
    
    for (const test of tests) {
      this.log(`\n📋 Running ${test.name} test...`, 'info');
      
      try {
        const result = await test.test();
        if (result) {
          passedTests++;
          this.log(`${test.name} test passed`, 'success');
        } else {
          this.log(`${test.name} test failed`, 'error');
        }
      } catch (error) {
        this.log(`${test.name} test failed with error: ${error.message}`, 'error');
      }
    }
    
    this.log('\n📊 Test Results Summary', 'info');
    this.log('========================', 'info');
    this.log(`Total Tests: ${totalTests}`, 'info');
    this.log(`Passed: ${passedTests}`, passedTests === totalTests ? 'success' : 'info');
    this.log(`Failed: ${totalTests - passedTests}`, totalTests - passedTests === 0 ? 'success' : 'error');
    this.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`, 'info');
    
    if (passedTests === totalTests) {
      this.log('\n🎉 All tests passed! Enhanced system is working correctly.', 'success');
    } else {
      this.log('\n⚠️  Some tests failed. Please check the server logs and configuration.', 'error');
    }
    
    this.log('\n📝 Next Steps:', 'info');
    this.log('1. Check the admin interface at http://localhost:3000/admin-waitlist.html', 'info');
    this.log('2. Test the public waitlist form at http://localhost:3000/waitlist.html', 'info');
    this.log('3. Review the API documentation at http://localhost:3000/api/docs', 'info');
    this.log('4. Monitor the cron job logs for automated processing', 'info');
  }
}

// Run the tests
async function main() {
  const tester = new EnhancedSystemTester();
  await tester.runAllTests();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { EnhancedSystemTester }; 