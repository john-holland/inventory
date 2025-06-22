#!/usr/bin/env node

/**
 * Marketplace Integration Toggles Test Script
 * Tests the emergency disable/enable functionality for Amazon and eBay
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const ADMIN_USER = {
  email: 'admin@test.com',
  password: 'admin123',
  username: 'admin'
};

async function testMarketplaceToggles() {
  console.log('🚀 Testing Marketplace Integration Toggles...\n');

  try {
    // Test 1: Login as admin
    console.log('1️⃣ Logging in as admin...');
    const loginResponse = await axios.post(`${BASE_URL}/api/users/login`, {
      email: ADMIN_USER.email,
      password: ADMIN_USER.password
    });

    if (!loginResponse.data.success) {
      console.log('❌ Login failed, creating admin user...');
      const registerResponse = await axios.post(`${BASE_URL}/api/users/register`, {
        email: ADMIN_USER.email,
        username: ADMIN_USER.username,
        password: ADMIN_USER.password,
        role: 'ADMIN'
      });
      
      if (!registerResponse.data.success) {
        throw new Error('Failed to create admin user');
      }
      console.log('✅ Admin user created successfully');
    } else {
      console.log('✅ Admin login successful');
    }

    const token = loginResponse.data.token || registerResponse.data.token;

    // Test 2: Check initial toggle status
    console.log('\n2️⃣ Checking initial toggle status...');
    const initialTogglesResponse = await axios.get(`${BASE_URL}/api/unleash/toggles`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (initialTogglesResponse.data.success) {
      const toggles = initialTogglesResponse.data.data;
      console.log('📊 Initial toggle status:');
      console.log(`   Amazon Integration: ${toggles.amazonIntegration?.enabled ? '✅ Enabled' : '❌ Disabled'}`);
      console.log(`   eBay Integration: ${toggles.ebayIntegration?.enabled ? '✅ Enabled' : '❌ Disabled'}`);
      console.log(`   Marketplace Search: ${toggles.marketplaceSearch?.enabled ? '✅ Enabled' : '❌ Disabled'}`);
    }

    // Test 3: Emergency disable all marketplaces
    console.log('\n3️⃣ Testing emergency disable...');
    const disableResponse = await axios.post(`${BASE_URL}/api/unleash/emergency-disable`, {
      integrations: ['amazonIntegration', 'ebayIntegration', 'marketplaceSearch']
    }, {
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      }
    });

    if (disableResponse.data.success) {
      console.log('🚨 Emergency disable successful');
      console.log('📝 Message:', disableResponse.data.message);
      console.log('🔒 Disabled integrations:', disableResponse.data.data.disabledToggles);
    } else {
      console.log('❌ Emergency disable failed:', disableResponse.data.error);
    }

    // Test 4: Verify toggles are disabled
    console.log('\n4️⃣ Verifying toggles are disabled...');
    const disabledTogglesResponse = await axios.get(`${BASE_URL}/api/unleash/toggles`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (disabledTogglesResponse.data.success) {
      const toggles = disabledTogglesResponse.data.data;
      console.log('📊 Toggle status after disable:');
      console.log(`   Amazon Integration: ${toggles.amazonIntegration?.enabled ? '✅ Enabled' : '❌ Disabled'}`);
      console.log(`   eBay Integration: ${toggles.ebayIntegration?.enabled ? '✅ Enabled' : '❌ Disabled'}`);
      console.log(`   Marketplace Search: ${toggles.marketplaceSearch?.enabled ? '✅ Enabled' : '❌ Disabled'}`);
    }

    // Test 5: Re-enable marketplaces
    console.log('\n5️⃣ Testing re-enable...');
    const enableResponse = await axios.post(`${BASE_URL}/api/unleash/re-enable`, {
      integrations: ['amazonIntegration', 'ebayIntegration']
    }, {
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      }
    });

    if (enableResponse.data.success) {
      console.log('✅ Re-enable successful');
      console.log('📝 Message:', enableResponse.data.message);
      console.log('🔓 Enabled integrations:', enableResponse.data.data.enabledToggles);
    } else {
      console.log('❌ Re-enable failed:', enableResponse.data.error);
    }

    // Test 6: Verify toggles are re-enabled
    console.log('\n6️⃣ Verifying toggles are re-enabled...');
    const enabledTogglesResponse = await axios.get(`${BASE_URL}/api/unleash/toggles`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (enabledTogglesResponse.data.success) {
      const toggles = enabledTogglesResponse.data.data;
      console.log('📊 Toggle status after re-enable:');
      console.log(`   Amazon Integration: ${toggles.amazonIntegration?.enabled ? '✅ Enabled' : '❌ Disabled'}`);
      console.log(`   eBay Integration: ${toggles.ebayIntegration?.enabled ? '✅ Enabled' : '❌ Disabled'}`);
      console.log(`   Marketplace Search: ${toggles.marketplaceSearch?.enabled ? '✅ Enabled' : '❌ Disabled'}`);
    }

    // Test 7: Test feature checking
    console.log('\n7️⃣ Testing feature checking...');
    const featureChecks = [
      { key: 'amazonIntegration', name: 'Amazon Integration' },
      { key: 'ebayIntegration', name: 'eBay Integration' },
      { key: 'marketplaceSearch', name: 'Marketplace Search' }
    ];

    for (const feature of featureChecks) {
      try {
        const featureResponse = await axios.get(`${BASE_URL}/api/unleash/feature/${feature.key}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (featureResponse.data.success) {
          console.log(`   ${feature.name}: ${featureResponse.data.data.enabled ? '✅ Enabled' : '❌ Disabled'}`);
        }
      } catch (error) {
        console.log(`   ${feature.name}: Error checking feature`);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }

  console.log('\n🎯 Marketplace Integration Toggles Test Complete!');
  console.log('\n📋 Next Steps:');
  console.log('1. Visit http://localhost:3000/unleash for emergency controls');
  console.log('2. Test with actual Amazon/eBay API calls');
  console.log('3. Verify integration blocking works in production');
  console.log('4. Set up monitoring for integration status');
}

// Run the test
testMarketplaceToggles().catch(console.error); 