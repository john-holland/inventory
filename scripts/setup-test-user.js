const bcrypt = require('bcryptjs');
const { MikroORM } = require('@mikro-orm/core');
const { User } = require('../server/entities/User');

async function setupTestUser() {
    try {
        // Initialize MikroORM
        const orm = await MikroORM.init({
            entities: ['../server/entities/**/*.js'],
            dbName: 'inventory_db',
            type: 'postgresql',
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            user: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || 'password',
        });

        const em = orm.em;

        // Check if test user already exists
        const existingUser = await em.findOne(User, { 
            $or: [
                { username: 'testuser' },
                { email: 'testuser@example.com' }
            ]
        });

        if (existingUser) {
            console.log('Test user already exists. Updating password...');
            const passwordHash = await bcrypt.hash('testpassword1', 10);
            existingUser.passwordHash = passwordHash;
            existingUser.updatedAt = new Date();
            await em.persistAndFlush(existingUser);
            console.log('Test user password updated successfully!');
        } else {
            console.log('Creating test user...');
            
            // Hash the password
            const passwordHash = await bcrypt.hash('testpassword1', 10);
            
            // Create test user
            const testUser = new User(
                'testuser@example.com',
                'testuser',
                passwordHash,
                null // walletAddress
            );
            
            // Set additional properties
            testUser.isVerified = true;
            testUser.availableBalance = 1000.00;
            testUser.heldBalance = 0;
            testUser.rating = 5.0;
            testUser.totalTransactions = 0;
            testUser.useMetricUnits = false;
            testUser.preferences = {
                notifications: true,
                emailUpdates: true
            };
            
            await em.persistAndFlush(testUser);
            console.log('Test user created successfully!');
        }

        console.log('\nTest User Credentials:');
        console.log('Username: testuser');
        console.log('Email: testuser@example.com');
        console.log('Password: testpassword1');
        console.log('\nYou can now log in with these credentials.');

        await orm.close();
    } catch (error) {
        console.error('Error setting up test user:', error);
        process.exit(1);
    }
}

// Run the setup
setupTestUser(); 