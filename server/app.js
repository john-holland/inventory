"use strict";

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

// Import database and entities
const { createConnection } = require('typeorm');
const entities = require('./entities');

// Import controllers
const itemController = require('./controllers/item.controller');
const holdController = require('./controllers/hold.controller');
const purchaseController = require('./controllers/purchase.controller');
const investmentPoolController = require('./controllers/investmentPool.controller');
const userAddressController = require('./controllers/userAddress.controller');
const userController = require('./controllers/user.controller');
const shippingController = require('./controllers/shipping.controller');
const backupController = require('./controllers/backup.controller');
const cryptoController = require('./controllers/cryptoController');
const taxController = require('./controllers/taxController');
const { CarePhotoController, router: carePhotoRouter } = require('./controllers/carePhoto.controller');
const { DisputeController, router: disputeRouter } = require('./controllers/dispute.controller');
const { NotificationController, router: notificationRouter } = require('./controllers/notification.controller');
const { WatchListController, router: watchListRouter } = require('./controllers/watchList.controller');
const UserController = require('./controllers/UserController');
const InventoryController = require('./controllers/InventoryController');
const InvestmentController = require('./controllers/InvestmentController');
const WaterLimitController = require('./controllers/WaterLimitController');
const UnleashController = require('./controllers/UnleashController');
const HealthCheckController = require('./controllers/HealthCheckController');
const BanRequestController = require('./controllers/BanRequestController');

// Import services
const InvestmentPoolService = require('./services/investmentPoolService');
const UserAddressService = require('./services/userAddressService');
const BackupService = require('./services/backupService');
const WarehouseService = require('./services/warehouseService');
const CoinbaseCommerceService = require('./services/coinbaseCommerceService');
const OAuth2Service = require('./services/oauth2Service');
const TaxService = require('./services/taxService');
const CarePhotoService = require('./services/carePhotoService');
const DisputeService = require('./services/disputeService');
const NotificationService = require('./services/notificationService');
const WatchListService = require('./services/watchListService');
const ShippingService = require('./services/shippingService');
const UnleashService = require('./services/unleashService');
const HealthCheckService = require('./services/healthCheckService');
const BanRequestService = require('./services/banRequestService');

// Import configuration
const { getCoefficient } = require('./config/ConstantMarketCoefficients');

// Import middleware
const AuthMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');
const uploadMiddleware = require('./middleware/upload');

// Import cron jobs
const { setupCronJobs } = require('./cron/cronJobs');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
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
        
        // Initialize services and controllers
        initializeServices();
        initializeControllers();
        setupRoutes();
        setupCronJobs(orm);
        
    } catch (error) {
        console.error('❌ Failed to initialize MikroORM:', error);
        process.exit(1);
    }
}

function initializeServices() {
    const em = orm.em;
    
    // Initialize repositories
    const userRepository = em.getRepository('User');
    const itemRepository = em.getRepository('Item');
    const holdRepository = em.getRepository('Hold');
    const transactionRepository = em.getRepository('Transaction');
    const investmentRepository = em.getRepository('Investment');
    const shippingRouteRepository = em.getRepository('ShippingRoute');
    const waterLimitRepository = em.getRepository('WaterLimit');
    const carePhotoRepository = em.getRepository('CarePhoto');
    const disputeRepository = em.getRepository('Dispute');
    const notificationRepository = em.getRepository('Notification');
    const watchListRepository = em.getRepository('WatchList');

    // Initialize services
    global.userService = new UserService(em, userRepository);
    global.inventoryService = new InventoryService(em, itemRepository, holdRepository, transactionRepository, userRepository, global.userService);
    global.investmentService = new InvestmentService(em, investmentRepository, userRepository, global.userService);
    global.billingService = new BillingService(em, transactionRepository, userRepository, global.userService);
    global.mappingService = new MappingService(em, shippingRouteRepository);
    global.waterLimitService = new WaterLimitService(em, waterLimitRepository, userRepository, global.userService);
    global.unleashService = new UnleashService(em);
    global.healthCheckService = new HealthCheckService(em);
    global.banRequestService = new BanRequestService(em);
    global.carePhotoService = new CarePhotoService(em, carePhotoRepository, holdRepository, userRepository);
    global.disputeService = new DisputeService(em, disputeRepository, holdRepository, carePhotoRepository, userRepository, global.notificationService, global.shippingService, global.investmentService);
    global.notificationService = new NotificationService(em, notificationRepository, userRepository);
    global.watchListService = new WatchListService(em, watchListRepository, userRepository, global.notificationService);
    global.shippingService = new ShippingService(em, shippingRouteRepository, userRepository);
    
    // Set up service dependencies
    global.healthCheckService.setNotificationService(global.notificationService);
    global.banRequestService.setNotificationService(global.notificationService);
    
    console.log('✅ Services initialized');
}

function initializeControllers() {
    const authMiddleware = new AuthMiddleware();
    
    // Initialize controllers
    global.userController = new UserController(global.userService, authMiddleware);
    global.inventoryController = new InventoryController(global.inventoryService, authMiddleware);
    global.investmentController = new InvestmentController(global.investmentService, authMiddleware);
    global.billingController = new BillingController(global.billingService, authMiddleware);
    global.mappingController = new MappingController(global.mappingService, authMiddleware);
    global.waterLimitController = new WaterLimitController(global.waterLimitService, authMiddleware);
    global.unleashController = new UnleashController(em);
    global.healthCheckController = new HealthCheckController(em);
    global.banRequestController = new BanRequestController(em);
    global.carePhotoController = new CarePhotoController(global.carePhotoService, authMiddleware);
    global.disputeController = new DisputeController(global.disputeService, authMiddleware);
    global.notificationController = new NotificationController(global.notificationService, authMiddleware);
    global.watchListController = new WatchListController(global.watchListService, authMiddleware);
    
    // Set up controller dependencies
    global.healthCheckController.setHealthCheckService(global.healthCheckService);
    global.banRequestController.setBanRequestService(global.banRequestService);
    
    console.log('✅ Controllers initialized');
}

function setupRoutes() {
    // API routes
    app.use('/api/users', global.userController.router);
    app.use('/api/inventory', global.inventoryController.router);
    app.use('/api/investments', global.investmentController.router);
    app.use('/api/billing', global.billingController.router);
    app.use('/api/mapping', global.mappingController.router);
    app.use('/api/water-limits', global.waterLimitController.router);
    app.use('/api/unleash', global.unleashController.router);
    app.use('/api/health-check', global.healthCheckController.router);
    app.use('/api/ban-requests', global.banRequestController.router);
    app.use('/api/care-photos', global.carePhotoController.router);
    app.use('/api/disputes', global.disputeController.router);
    app.use('/api/notifications', global.notificationController.router);
    app.use('/api/watch-list', global.watchListController.router);

    // Frontend routes
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, '../public/index.html'));
    });

    app.get('/dashboard', (req, res) => {
        res.sendFile(path.join(__dirname, '../public/dashboard-modern.html'));
    });

    app.get('/dashboard-old', (req, res) => {
        res.sendFile(path.join(__dirname, '../public/dashboard.html'));
    });

    app.get('/chat', (req, res) => {
        res.sendFile(path.join(__dirname, '../public/chat.html'));
    });

    app.get('/hr', (req, res) => {
        res.sendFile(path.join(__dirname, '../public/hr.html'));
    });

    app.get('/calendar', (req, res) => {
        res.sendFile(path.join(__dirname, '../public/calendar.html'));
    });

    app.get('/map', (req, res) => {
        res.sendFile(path.join(__dirname, '../public/map.html'));
    });

    app.get('/unleash', (req, res) => {
        res.sendFile(path.join(__dirname, '../public/unleash.html'));
    });

    app.get('/health-monitor', (req, res) => {
        res.sendFile(path.join(__dirname, '../public/health-monitor.html'));
    });

    app.get('/csr-ban-management', (req, res) => {
        res.sendFile(path.join(__dirname, '../public/csr-ban-management.html'));
    });

    app.get('/admin-ban-management', (req, res) => {
        res.sendFile(path.join(__dirname, '../public/admin-ban-management.html'));
    });

    // Health check
    app.get('/health', (req, res) => {
        res.json({ 
            status: 'healthy', 
            timestamp: new Date().toISOString(),
            version: '3.0.0'
        });
    });
    
    console.log('✅ Routes configured');
}

function setupCronJobs(orm) {
    // Investment robot updates - every 6 hours
    cron.schedule('0 */6 * * *', async () => {
        try {
            console.log('🤖 Running investment robot updates...');
            await global.investmentService.runInvestmentRobots();
            console.log('✅ Investment robot updates completed');
        } catch (error) {
            console.error('❌ Investment robot update failed:', error);
        }
    });

    // Hold stagnation revenue - daily at 2 AM
    cron.schedule('0 2 * * *', async () => {
        try {
            console.log('💰 Processing hold stagnation revenue...');
            await global.billingService.processHoldStagnationRevenue();
            console.log('✅ Hold stagnation revenue processed');
        } catch (error) {
            console.error('❌ Hold stagnation revenue processing failed:', error);
        }
    });

    // Energy efficiency revenue - daily at 3 AM
    cron.schedule('0 3 * * *', async () => {
        try {
            console.log('⚡ Processing energy efficiency revenue...');
            await global.billingService.processEnergyEfficiencyRevenue();
            console.log('✅ Energy efficiency revenue processed');
        } catch (error) {
            console.error('❌ Energy efficiency revenue processing failed:', error);
        }
    });

    // Water limit releases - every 4 hours
    cron.schedule('0 */4 * * *', async () => {
        try {
            console.log('💧 Processing water limit releases...');
            await global.waterLimitService.processReleases();
            console.log('✅ Water limit releases processed');
        } catch (error) {
            console.error('❌ Water limit release processing failed:', error);
        }
    });

    // Health checks - every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
        try {
            console.log('🏥 Running marketplace health checks...');
            await global.healthCheckService.runHealthChecks();
            console.log('✅ Health checks completed');
        } catch (error) {
            console.error('❌ Health checks failed:', error);
        }
    });

    // Ban request cleanup - every hour
    cron.schedule('0 * * * *', async () => {
        try {
            console.log('🧹 Cleaning up expired ban requests...');
            await global.banRequestService.cleanupExpiredRequests();
            console.log('✅ Ban request cleanup completed');
        } catch (error) {
            console.error('❌ Ban request cleanup failed:', error);
        }
    });

    console.log('✅ Cron jobs scheduled');
}

// Error handling middleware
app.use(errorHandler);

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

module.exports = app;