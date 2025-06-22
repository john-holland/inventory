#!/usr/bin/env node

/**
 * Unleash Feature Flags Test Script
 * Tests the Unleash implementation with proper access levels
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const TEST_USER = {
  email: 'admin@test.com',
  password: 'admin123',
  username: 'admin'
};

async function testUnleashImplementation() {
  console.log('🚀 Testing Unleash Feature Flags Implementation...\n');

  try {
    // Test 1: Register admin user
    console.log('1️⃣ Registering admin user...');
    const registerResponse = await axios.post(`${BASE_URL}/api/users/register`, {
      email: TEST_USER.email,
      username: TEST_USER.username,
      password: TEST_USER.password,
      role: 'ADMIN'
    });

    if (registerResponse.data.success) {
      console.log('✅ Admin user registered successfully');
      const token = registerResponse.data.token;
      
      // Test 2: Get Unleash toggles (should work for admin)
      console.log('\n2️⃣ Testing Unleash toggles access...');
      try {
        const togglesResponse = await axios.get(`${BASE_URL}/api/unleash/toggles`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (togglesResponse.data.success) {
          console.log('✅ Unleash toggles retrieved successfully');
          console.log('📊 Available toggles:', Object.keys(togglesResponse.data.data));
        }
      } catch (error) {
        console.log('❌ Failed to get toggles:', error.response?.data?.error || error.message);
      }

      // Test 3: Update a toggle
      console.log('\n3️⃣ Testing toggle update...');
      try {
        const updateResponse = await axios.post(`${BASE_URL}/api/unleash/toggles`, {
          toggleKey: 'darkMode',
          enabled: true,
          description: 'Enable dark mode theme for all users'
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (updateResponse.data.success) {
          console.log('✅ Toggle updated successfully');
          console.log('📝 Message:', updateResponse.data.message);
        }
      } catch (error) {
        console.log('❌ Failed to update toggle:', error.response?.data?.error || error.message);
      }

      // Test 4: Check feature status
      console.log('\n4️⃣ Testing feature check...');
      try {
        const featureResponse = await axios.get(`${BASE_URL}/api/unleash/feature/darkMode`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (featureResponse.data.success) {
          console.log('✅ Feature check successful');
          console.log('🔧 Feature status:', featureResponse.data.data);
        }
      } catch (error) {
        console.log('❌ Failed to check feature:', error.response?.data?.error || error.message);
      }

      // Test 5: Get analytics
      console.log('\n5️⃣ Testing analytics...');
      try {
        const analyticsResponse = await axios.get(`${BASE_URL}/api/unleash/analytics`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (analyticsResponse.data.success) {
          console.log('✅ Analytics retrieved successfully');
          console.log('📈 Analytics data:', analyticsResponse.data.data);
        }
      } catch (error) {
        console.log('❌ Failed to get analytics:', error.response?.data?.error || error.message);
      }

      // Test 6: Test non-admin access (should fail)
      console.log('\n6️⃣ Testing non-admin access...');
      const regularUser = {
        email: 'user@test.com',
        password: 'user123',
        username: 'regularuser'
      };

      const userRegisterResponse = await axios.post(`${BASE_URL}/api/users/register`, {
        email: regularUser.email,
        username: regularUser.username,
        password: regularUser.password,
        role: 'USER'
      });

      if (userRegisterResponse.data.success) {
        const userToken = userRegisterResponse.data.token;
        
        try {
          await axios.get(`${BASE_URL}/api/unleash/toggles`, {
            headers: { Authorization: `Bearer ${userToken}` }
          });
          console.log('❌ Non-admin user was able to access Unleash (should have failed)');
        } catch (error) {
          if (error.response?.status === 403) {
            console.log('✅ Non-admin access correctly blocked');
            console.log('🔒 Error message:', error.response.data.error);
          } else {
            console.log('❌ Unexpected error for non-admin access:', error.response?.data?.error || error.message);
          }
        }
      }

    } else {
      console.log('❌ Failed to register admin user:', registerResponse.data.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }

  console.log('\n🎯 Unleash Feature Flags Test Complete!');
  console.log('\n📋 Next Steps:');
  console.log('1. Visit http://localhost:3000/unleash for the admin interface');
  console.log('2. Visit http://localhost:3000/dashboard to see Unleash section');
  console.log('3. Test different user roles and access levels');
}

// Run the test
testUnleashImplementation().catch(console.error); 