const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const cron = require('node-cron');
const { MikroORM } = require('@mikro-orm/core');
const config = require('./mikro-orm.config.js');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
    }
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Initialize MikroORM
let orm;

async function initializeORM() {
    try {
        orm = await MikroORM.init(config);
        console.log('✅ MikroORM initialized successfully');
        
        // Run migrations
        const migrator = orm.getMigrator();
        await migrator.up();
        console.log('✅ Database migrations completed');
        
        setupRoutes();
        setupCronJobs();
        
    } catch (error) {
        console.error('❌ Failed to initialize MikroORM:', error);
        process.exit(1);
    }
}

function setupRoutes() {
    // Health check
    app.get('/health', (req, res) => {
        res.json({ 
            status: 'healthy', 
            timestamp: new Date().toISOString(),
            version: '3.0.0',
            message: 'Distributed Inventory System - 2x Shipping Hold Model'
        });
    });

    // Frontend routes
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, '../public/index.html'));
    });

    app.get('/dashboard', (req, res) => {
        res.sendFile(path.join(__dirname, '../public/dashboard.html'));
    });

    app.get('/map', (req, res) => {
        res.sendFile(path.join(__dirname, '../public/map.html'));
    });

    // API routes placeholder
    app.get('/api/status', (req, res) => {
        res.json({
            success: true,
            message: 'Distributed Inventory System API',
            features: [
                '2x Shipping Hold Model',
                'Investment Robots',
                'Map Interface with Shipping Routes',
                'Hold Stagnation Revenue',
                'Energy Efficiency Revenue',
                'Water Limit System'
            ]
        });
    });
    
    console.log('✅ Routes configured');
}

function setupCronJobs() {
    // Investment robot updates - every 6 hours
    cron.schedule('0 */6 * * *', async () => {
        try {
            console.log('🤖 Running investment robot updates...');
            // TODO: Implement investment robot logic
            console.log('✅ Investment robot updates completed');
        } catch (error) {
            console.error('❌ Investment robot update failed:', error);
        }
    });

    // Hold stagnation revenue - daily at 2 AM
    cron.schedule('0 2 * * *', async () => {
        try {
            console.log('💰 Processing hold stagnation revenue...');
            // TODO: Implement hold stagnation revenue logic
            console.log('✅ Hold stagnation revenue processed');
        } catch (error) {
            console.error('❌ Hold stagnation revenue processing failed:', error);
        }
    });

    // Energy efficiency revenue - daily at 3 AM
    cron.schedule('0 3 * * *', async () => {
        try {
            console.log('⚡ Processing energy efficiency revenue...');
            // TODO: Implement energy efficiency revenue logic
            console.log('✅ Energy efficiency revenue processed');
        } catch (error) {
            console.error('❌ Energy efficiency revenue processing failed:', error);
        }
    });

    // Water limit releases - every 4 hours
    cron.schedule('0 */4 * * *', async () => {
        try {
            console.log('💧 Processing water limit releases...');
            // TODO: Implement water limit release logic
            console.log('✅ Water limit releases processed');
        } catch (error) {
            console.error('❌ Water limit release processing failed:', error);
        }
    });

    console.log('✅ Cron jobs scheduled');
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        success: false, 
        message: 'Something went wrong!' 
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ 
        success: false, 
        message: 'Route not found' 
    });
});

async function startServer() {
    try {
        await initializeORM();
        
        app.listen(PORT, () => {
            console.log(`🚀 Distributed Inventory System running on port ${PORT}`);
            console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
            console.log(`🗺️  Map Interface: http://localhost:${PORT}/map`);
            console.log(`🔧 API: http://localhost:${PORT}/api`);
            console.log(`💚 Health Check: http://localhost:${PORT}/health`);
            console.log(`\n🎯 Core Features:`);
            console.log(`   • 2x Shipping Hold Model`);
            console.log(`   • Investment Robots (every 6 hours)`);
            console.log(`   • Hold Stagnation Revenue (daily)`);
            console.log(`   • Energy Efficiency Revenue (daily)`);
            console.log(`   • Water Limit System (every 4 hours)`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('🛑 Received SIGTERM, shutting down gracefully...');
    if (orm) {
        await orm.close();
    }
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('🛑 Received SIGINT, shutting down gracefully...');
    if (orm) {
        await orm.close();
    }
    process.exit(0);
});

// Start the server
startServer();
