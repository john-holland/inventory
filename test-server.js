const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// In-memory storage for testing
const users = [];
const items = [];
const holds = [];

// JWT secret
const JWT_SECRET = 'test-secret-key';

// Routes
app.get('/', (req, res) => {
  res.send(`
    <h1>Inventory System Test Server</h1>
    <p>Server is running on port ${PORT}</p>
    <h2>Available endpoints:</h2>
    <ul>
      <li>POST /api/auth/register - Register new user</li>
      <li>POST /api/auth/login - Login user</li>
      <li>GET /api/users/profile - Get user profile (requires auth)</li>
      <li>POST /api/inventory/items - Create item (requires auth)</li>
      <li>GET /api/inventory/items - List items</li>
      <li>POST /api/inventory/holds - Create hold (requires auth)</li>
      <li>GET /api/inventory/holds - List holds (requires auth)</li>
    </ul>
  `);
});

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = users.find(u => u.username === username || u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = {
      id: users.length + 1,
      username,
      email,
      password: hashedPassword,
      wallet: 1000, // Starting balance
      createdAt: new Date()
    };

    users.push(user);

    // Generate token
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        wallet: user.wallet
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Find user
    const user = users.find(u => u.username === username);
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        wallet: user.wallet
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/users/profile', authenticateToken, (req, res) => {
  const user = users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({
    id: user.id,
    username: user.username,
    email: user.email,
    wallet: user.wallet,
    createdAt: user.createdAt
  });
});

// Inventory routes
app.post('/api/inventory/items', authenticateToken, (req, res) => {
  try {
    const { name, description, price, condition, weight, dimensions } = req.body;

    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    const item = {
      id: items.length + 1,
      name,
      description: description || '',
      price: parseFloat(price),
      condition: condition || 'Good',
      weight: weight || null,
      dimensions: dimensions || null,
      listerId: req.user.id,
      status: 'available',
      createdAt: new Date()
    };

    items.push(item);

    res.status(201).json({
      message: 'Item created successfully',
      item
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/inventory/items', (req, res) => {
  res.json({
    items: items.filter(item => item.status === 'available'),
    total: items.filter(item => item.status === 'available').length
  });
});

app.post('/api/inventory/holds', authenticateToken, (req, res) => {
  try {
    const { itemId, holdAmount } = req.body;

    if (!itemId || !holdAmount) {
      return res.status(400).json({ error: 'Item ID and hold amount are required' });
    }

    const item = items.find(i => i.id === parseInt(itemId) && i.status === 'available');
    if (!item) {
      return res.status(404).json({ error: 'Item not found or not available' });
    }

    const user = users.find(u => u.id === req.user.id);
    if (user.wallet < holdAmount) {
      return res.status(400).json({ error: 'Insufficient funds' });
    }

    // Calculate shipping cost (simplified)
    const shippingCost = Math.max(5, holdAmount * 0.1);
    const totalHoldAmount = holdAmount + shippingCost;

    if (user.wallet < totalHoldAmount) {
      return res.status(400).json({ error: 'Insufficient funds for hold and shipping' });
    }

    // Deduct from wallet
    user.wallet -= totalHoldAmount;

    const hold = {
      id: holds.length + 1,
      itemId: parseInt(itemId),
      userId: req.user.id,
      holdAmount: parseFloat(holdAmount),
      shippingCost,
      totalAmount: totalHoldAmount,
      status: 'active',
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    };

    holds.push(hold);

    // Update item status
    item.status = 'held';

    res.status(201).json({
      message: 'Hold created successfully',
      hold,
      remainingWallet: user.wallet
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/inventory/holds', authenticateToken, (req, res) => {
  const userHolds = holds.filter(hold => hold.userId === req.user.id);
  
  const holdsWithItems = userHolds.map(hold => {
    const item = items.find(i => i.id === hold.itemId);
    return {
      ...hold,
      item: item ? {
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price
      } : null
    };
  });

  res.json({
    holds: holdsWithItems,
    total: holdsWithItems.length
  });
});

// Start server
app.listen(PORT, () => {
  console.log("🚀 We're on the Moon Yall!");
  console.log(`Test server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('- POST /api/auth/register');
  console.log('- POST /api/auth/login');
  console.log('- GET /api/users/profile');
  console.log('- POST /api/inventory/items');
  console.log('- GET /api/inventory/items');
  console.log('- POST /api/inventory/holds');
  console.log('- GET /api/inventory/holds');
}); 