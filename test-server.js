const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// In-memory user storage for testing
const users = [];

// Test user creation endpoint
app.post('/api/users/register', async (req, res) => {
    try {
        const { username, email, password, phone, defaultAddress } = req.body;
        
        // Check if user already exists
        const existingUser = users.find(u => u.email === email || u.username === username);
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User already exists'
            });
        }
        
        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);
        
        // Create user
        const user = {
            id: Date.now().toString(),
            username,
            email,
            passwordHash,
            phone,
            defaultAddress,
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
        
        users.push(user);
        
        console.log('✅ Test user created:', { username, email });
        
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        });
        
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed'
        });
    }
});

// Login endpoint
app.post('/api/users/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user
        const user = users.find(u => u.email === email || u.username === email);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        
        // Check password
        const isValidPassword = await bcrypt.compare(password, user.passwordHash);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        
        // Generate token
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            'test-secret-key',
            { expiresIn: '24h' }
        );
        
        console.log('✅ User logged in:', user.username);
        
        res.json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                availableBalance: user.availableBalance,
                heldBalance: user.heldBalance,
                rating: user.rating,
                totalTransactions: user.totalTransactions,
                useMetricUnits: user.useMetricUnits,
                preferences: user.preferences
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed'
        });
    }
});

// Profile endpoint
app.get('/api/users/profile', (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Authentication token required'
            });
        }
        
        const decoded = jwt.verify(token, 'test-secret-key');
        const user = users.find(u => u.id === decoded.userId);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
        
        res.json({
            success: true,
            message: 'User profile retrieved successfully',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                availableBalance: user.availableBalance,
                heldBalance: user.heldBalance,
                rating: user.rating,
                totalTransactions: user.totalTransactions,
                useMetricUnits: user.useMetricUnits,
                preferences: user.preferences
            }
        });
        
    } catch (error) {
        console.error('Profile error:', error);
        res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
});

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.get('/login.html', (req, res) => {
    res.sendFile(__dirname + '/public/login.html');
});

app.get('/index.html', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Test server running on http://localhost:${PORT}`);
    console.log(`📝 Login page: http://localhost:${PORT}/login.html`);
    console.log(`🏠 Dashboard: http://localhost:${PORT}/index.html`);
    console.log('\n📋 Test User Credentials:');
    console.log('Username: testuser');
    console.log('Email: testuser@example.com');
    console.log('Password: testpassword1');
    console.log('\n💡 Run the test user creation script now!');
}); 