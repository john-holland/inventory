const https = require('https');
const http = require('http');

// Simple function to make HTTP requests
function makeRequest(options, data) {
    return new Promise((resolve, reject) => {
        const protocol = options.port === 443 ? https : http;
        const req = protocol.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });
            res.on('end', () => {
                try {
                    const response = JSON.parse(body);
                    resolve({ status: res.statusCode, data: response });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });
        
        req.on('error', (err) => {
            reject(err);
        });
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function createTestUser() {
    try {
        console.log('Creating test user via API...');
        
        const userData = {
            username: 'testuser',
            email: 'testuser@example.com',
            password: 'testpassword1',
            phone: '+1234567890',
            defaultAddress: '123 Test Street, Test City, TC 12345'
        };
        
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/users/register',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': JSON.stringify(userData).length
            }
        };
        
        const response = await makeRequest(options, userData);
        
        if (response.status === 201 || response.status === 200) {
            console.log('✅ Test user created successfully!');
            console.log('\n📋 Test User Credentials:');
            console.log('Username: testuser');
            console.log('Email: testuser@example.com');
            console.log('Password: testpassword1');
            console.log('\n🔗 You can now log in at: http://localhost:3000/login.html');
        } else {
            console.log('❌ Failed to create test user');
            console.log('Status:', response.status);
            console.log('Response:', response.data);
        }
        
    } catch (error) {
        console.error('❌ Error creating test user:', error.message);
        console.log('\n💡 Make sure your server is running on port 3000');
        console.log('   Run: npm start');
    }
}

// Also create a login test function
async function testLogin() {
    try {
        console.log('\n🧪 Testing login...');
        
        const loginData = {
            email: 'testuser@example.com',
            password: 'testpassword1'
        };
        
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/users/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': JSON.stringify(loginData).length
            }
        };
        
        const response = await makeRequest(options, loginData);
        
        if (response.status === 200 && response.data.success) {
            console.log('✅ Login test successful!');
            console.log('Token received:', response.data.token ? 'Yes' : 'No');
        } else {
            console.log('❌ Login test failed');
            console.log('Status:', response.status);
            console.log('Response:', response.data);
        }
        
    } catch (error) {
        console.error('❌ Error testing login:', error.message);
    }
}

// Run the functions
async function main() {
    await createTestUser();
    await testLogin();
}

main(); 