const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Simple test user creation without MikroORM
async function createTestUser() {
    try {
        // Hash the password
        const passwordHash = await bcrypt.hash('testpassword1', 10);
        
        // Create test user object
        const testUser = {
            id: uuidv4(),
            email: 'testuser@example.com',
            username: 'testuser',
            passwordHash: passwordHash,
            walletAddress: null,
            isVerified: true,
            rating: 5.0,
            totalTransactions: 0,
            availableBalance: 1000.00,
            heldBalance: 0,
            location: null,
            preferences: {
                notifications: true,
                emailUpdates: true
            },
            useMetricUnits: false,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        console.log('Test User Created Successfully!');
        console.log('\nTest User Credentials:');
        console.log('Username: testuser');
        console.log('Email: testuser@example.com');
        console.log('Password: testpassword1');
        console.log('\nUser ID:', testUser.id);
        console.log('Password Hash:', testUser.passwordHash);
        console.log('\nYou can now use these credentials to log in.');
        console.log('\nTo add this user to your database, you can:');
        console.log('1. Start your server');
        console.log('2. Use the registration endpoint with these credentials');
        console.log('3. Or manually insert this user into your database');
        
    } catch (error) {
        console.error('Error creating test user:', error);
    }
}

createTestUser(); 