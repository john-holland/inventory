const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testSystem() {
    console.log('🧪 Testing Distributed Inventory System - New Features\n');

    try {
        // Test 1: Health Check
        console.log('1. Testing Health Check...');
        const healthResponse = await axios.get(`${BASE_URL}/health`);
        console.log('✅ Health Check:', healthResponse.data);
        console.log('');

        // Test 2: API Status
        console.log('2. Testing API Status...');
        const apiResponse = await axios.get(`${BASE_URL}/api/status`);
        console.log('✅ API Status:', apiResponse.data);
        console.log('');

        // Test 3: Map Interface
        console.log('3. Testing Map Interface...');
        const mapResponse = await axios.get(`${BASE_URL}/map`);
        console.log('✅ Map Interface: Available (Status:', mapResponse.status, ')');
        console.log('');

        // Test 4: Dashboard
        console.log('4. Testing Dashboard...');
        const dashboardResponse = await axios.get(`${BASE_URL}/dashboard`);
        console.log('✅ Dashboard: Available (Status:', dashboardResponse.status, ')');
        console.log('');

        console.log('🎉 All basic tests passed!');
        console.log('\n📋 Available Features:');
        console.log('   • 2x Shipping Hold Model');
        console.log('   • Investment Robots (every 6 hours)');
        console.log('   • Hold Stagnation Revenue (daily)');
        console.log('   • Energy Efficiency Revenue (daily)');
        console.log('   • Water Limit System (every 4 hours)');
        console.log('   • Map Interface with Eyelash Routes');
        console.log('   • eBay Integration (Ready for API Keys)');
        console.log('   • Chat System (Entities Created)');
        console.log('   • HR System (Entities Created)');
        console.log('   • Calendar System (Entities Created)');

        console.log('\n🚀 Next Steps:');
        console.log('   1. Add eBay API credentials to .env');
        console.log('   2. Add Google Calendar API credentials');
        console.log('   3. Configure email settings');
        console.log('   4. Run database migrations');
        console.log('   5. Start implementing services and controllers');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Make sure the server is running:');
            console.log('   npm run dev');
        }
    }
}

// Run tests
testSystem(); 