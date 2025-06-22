#!/usr/bin/env node

/**
 * Health Check & CSR System Test Script
 * Tests the complete health monitoring and customer support system
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const ADMIN_USER = {
  email: 'admin@test.com',
  password: 'admin123',
  username: 'admin'
};

const CSR_USER = {
  email: 'csr@test.com',
  password: 'csr123',
  username: 'csr_support'
};

const IT_USER = {
  email: 'it@test.com',
  password: 'it123',
  username: 'it_employee'
};

async function testHealthCSRSystem() {
  console.log('🚀 Testing Health Check & CSR System...\n');

  try {
    // Test 1: Setup users
    console.log('1️⃣ Setting up test users...');
    const adminToken = await setupUser(ADMIN_USER, 'ADMIN');
    const csrToken = await setupUser(CSR_USER, 'CUSTOMER_SUPPORT_ROLE_EMPLOYEE');
    const itToken = await setupUser(IT_USER, 'IT_EMPLOYEE');
    
    console.log('✅ Test users created successfully');

    // Test 2: Test health check endpoints
    console.log('\n2️⃣ Testing health check endpoints...');
    await testHealthCheckEndpoints(adminToken);

    // Test 3: Test ban request system
    console.log('\n3️⃣ Testing ban request system...');
    await testBanRequestSystem(csrToken, adminToken);

    // Test 4: Test health monitoring
    console.log('\n4️⃣ Testing health monitoring...');
    await testHealthMonitoring(adminToken);

    // Test 5: Test CSR dispute resolution
    console.log('\n5️⃣ Testing CSR dispute resolution...');
    await testDisputeResolution(csrToken);

    // Test 6: Test notifications
    console.log('\n6️⃣ Testing notifications...');
    await testNotifications(itToken);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }

  console.log('\n🎯 Health Check & CSR System Test Complete!');
  console.log('\n📋 Next Steps:');
  console.log('1. Visit http://localhost:3000/health-monitor for health monitoring');
  console.log('2. Visit http://localhost:3000/csr-ban-management for CSR tools');
  console.log('3. Check cron jobs are running for automatic health checks');
  console.log('4. Test with real marketplace integrations');
}

async function setupUser(userData, role) {
  try {
    // Try to login first
    const loginResponse = await axios.post(`${BASE_URL}/api/users/login`, {
      email: userData.email,
      password: userData.password
    });

    if (loginResponse.data.success) {
      return loginResponse.data.token;
    }
  } catch (error) {
    // User doesn't exist, create them
  }

  // Create user
  const registerResponse = await axios.post(`${BASE_URL}/api/users/register`, {
    email: userData.email,
    username: userData.username,
    password: userData.password,
    role: role
  });

  if (!registerResponse.data.success) {
    throw new Error(`Failed to create ${role} user`);
  }

  return registerResponse.data.token;
}

async function testHealthCheckEndpoints(adminToken) {
  try {
    // Test health status endpoint
    const statusResponse = await axios.get(`${BASE_URL}/api/health-check/status`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    if (statusResponse.data.success) {
      console.log('✅ Health status endpoint working');
      console.log('📊 Current status:', statusResponse.data.data);
    }

    // Test health config endpoint
    const configResponse = await axios.get(`${BASE_URL}/api/health-check/config`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    if (configResponse.data.success) {
      console.log('✅ Health config endpoint working');
      console.log('⚙️ Config:', configResponse.data.data);
    }

    // Test manual health check
    const runResponse = await axios.post(`${BASE_URL}/api/health-check/run`, {}, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    if (runResponse.data.success) {
      console.log('✅ Manual health check working');
      console.log('🏥 Results:', runResponse.data.data);
    }

  } catch (error) {
    console.log('❌ Health check endpoints failed:', error.response?.data?.error || error.message);
  }
}

async function testBanRequestSystem(csrToken, adminToken) {
  try {
    // Create a test user for ban requests
    const testUserResponse = await axios.post(`${BASE_URL}/api/users/register`, {
      email: 'testuser@test.com',
      username: 'testuser',
      password: 'test123',
      role: 'USER'
    });

    if (!testUserResponse.data.success) {
      throw new Error('Failed to create test user');
    }

    const testUserId = testUserResponse.data.user.id;

    // Test creating ban request
    const banRequestResponse = await axios.post(`${BASE_URL}/api/ban-requests/create`, {
      targetUserId: testUserId,
      banLevel: 'chat_ban',
      reason: 'Test ban request for system verification',
      evidence: { description: 'Automated test evidence' },
      type: 'ban_request'
    }, {
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${csrToken}` 
      }
    });

    if (banRequestResponse.data.success) {
      console.log('✅ Ban request created successfully');
      const requestId = banRequestResponse.data.data.id;

      // Test getting pending requests (admin)
      const pendingResponse = await axios.get(`${BASE_URL}/api/ban-requests/pending`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      if (pendingResponse.data.success) {
        console.log('✅ Pending requests retrieved');
        console.log('📋 Pending requests:', pendingResponse.data.data.length);
      }

      // Test voting on request (admin)
      const voteResponse = await axios.post(`${BASE_URL}/api/ban-requests/vote/${requestId}`, {
        vote: 'approve'
      }, {
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}` 
        }
      });

      if (voteResponse.data.success) {
        console.log('✅ Ban request voted on successfully');
      }
    }

  } catch (error) {
    console.log('❌ Ban request system failed:', error.response?.data?.error || error.message);
  }
}

async function testHealthMonitoring(adminToken) {
  try {
    // Test health history
    const historyResponse = await axios.get(`${BASE_URL}/api/health-check/history?limit=10`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    
    if (historyResponse.data.success) {
      console.log('✅ Health history endpoint working');
      console.log('📊 History entries:', historyResponse.data.data.length);
    }

    // Test emergency disable
    const disableResponse = await axios.post(`${BASE_URL}/api/unleash/emergency-disable`, {
      integrations: ['amazonIntegration']
    }, {
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}` 
      }
    });

    if (disableResponse.data.success) {
      console.log('✅ Emergency disable working');
      console.log('🚨 Disabled integrations:', disableResponse.data.data.disabledToggles);
    }

    // Test re-enable
    const enableResponse = await axios.post(`${BASE_URL}/api/unleash/re-enable`, {
      integrations: ['amazonIntegration']
    }, {
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}` 
      }
    });

    if (enableResponse.data.success) {
      console.log('✅ Re-enable working');
      console.log('✅ Re-enabled integrations:', enableResponse.data.data.enabledToggles);
    }

  } catch (error) {
    console.log('❌ Health monitoring failed:', error.response?.data?.error || error.message);
  }
}

async function testDisputeResolution(csrToken) {
  try {
    // Test getting disputes
    const disputesResponse = await axios.get(`${BASE_URL}/api/disputes`, {
      headers: { Authorization: `Bearer ${csrToken}` }
    });
    
    if (disputesResponse.data.success) {
      console.log('✅ Disputes endpoint working');
      console.log('⚖️ Disputes found:', disputesResponse.data.disputes?.length || 0);
    }

    // Test getting CSR ban requests
    const csrRequestsResponse = await axios.get(`${BASE_URL}/api/ban-requests/csr`, {
      headers: { Authorization: `Bearer ${csrToken}` }
    });
    
    if (csrRequestsResponse.data.success) {
      console.log('✅ CSR ban requests endpoint working');
      console.log('📋 CSR requests:', csrRequestsResponse.data.data.length);
    }

  } catch (error) {
    console.log('❌ Dispute resolution failed:', error.response?.data?.error || error.message);
  }
}

async function testNotifications(itToken) {
  try {
    // Test getting notifications
    const notificationsResponse = await axios.get(`${BASE_URL}/api/notifications`, {
      headers: { Authorization: `Bearer ${itToken}` }
    });
    
    if (notificationsResponse.data.success) {
      console.log('✅ Notifications endpoint working');
      console.log('🔔 Notifications found:', notificationsResponse.data.notifications?.length || 0);
    }

    // Test unread count
    const unreadResponse = await axios.get(`${BASE_URL}/api/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${itToken}` }
    });
    
    if (unreadResponse.data.success) {
      console.log('✅ Unread notifications endpoint working');
      console.log('📬 Unread count:', unreadResponse.data.count);
    }

  } catch (error) {
    console.log('❌ Notifications failed:', error.response?.data?.error || error.message);
  }
}

// Run the test
testHealthCSRSystem().catch(console.error); 