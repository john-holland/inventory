"use strict";

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
const cron = require('node-cron');

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

// Import services
const InvestmentPoolService = require('./services/investmentPoolService');
const UserAddressService = require('./services/userAddressService');
const BackupService = require('./services/backupService');
const WarehouseService = require('./services/warehouseService');
const CoinbaseCommerceService = require('./services/coinbaseCommerceService');
const OAuth2Service = require('./services/oauth2Service');
const TaxService = require('./services/taxService');

// Import configuration
const { getCoefficient } = require('./config/ConstantMarketCoefficients');

// Import middleware
const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');
const uploadMiddleware = require('./middleware/upload');

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

// Database connection
let connection;
async function initializeDatabase() {
    try {
        connection = await createConnection({
            type: 'postgres',
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            username: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || 'password',
            database: process.env.DB_NAME || 'inventory_system',
            entities: entities,
            synchronize: process.env.NODE_ENV !== 'production',
            logging: process.env.NODE_ENV === 'development',
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });
        console.log('Database connected successfully');
    } catch (error) {
        console.error('Database connection failed:', error);
        process.exit(1);
    }
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Inventory System API is running',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        features: {
            backup: true,
            warehouse: true,
            investment: true,
            shipping: true
        }
    });
});

// Item routes
app.get('/api/inventory/items', itemController.getAllItems);
app.get('/api/inventory/items/:id', itemController.getItemById);
app.post('/api/inventory/items', authMiddleware, uploadMiddleware.array('images', 5), itemController.createItem);
app.put('/api/inventory/items/:id', authMiddleware, uploadMiddleware.array('images', 5), itemController.updateItem);
app.delete('/api/inventory/items/:id', authMiddleware, itemController.deleteItem);
app.get('/api/inventory/items/user/:userId', itemController.getUserItems);
app.get('/api/inventory/search', itemController.searchItems);
app.get('/api/inventory/stats', itemController.getItemStats);
app.post('/api/inventory/import', authMiddleware, itemController.importItem);

// Hold routes
app.post('/api/holds', authMiddleware, holdController.createHold);
app.get('/api/holds/user', authMiddleware, holdController.getUserHolds);
app.get('/api/holds/items', authMiddleware, holdController.getItemHolds);
app.get('/api/holds/:holdId', authMiddleware, holdController.getHoldById);
app.put('/api/holds/:holdId/release', authMiddleware, holdController.releaseHold);
app.put('/api/holds/:holdId/extend', authMiddleware, holdController.extendHold);
app.get('/api/holds/item/:itemId', holdController.getHoldsByItem);
app.get('/api/holds/stats', authMiddleware, holdController.getHoldStats);

// Purchase routes
app.post('/api/purchases/offers', authMiddleware, purchaseController.createOffer);
app.get('/api/purchases/pending', authMiddleware, purchaseController.getPendingOffers);
app.get('/api/purchases/my-offers', authMiddleware, purchaseController.getMyOffers);
app.post('/api/purchases/offers/:offerId/:response', authMiddleware, purchaseController.respondToOffer);
app.post('/api/purchases/offers/:offerId/accept-counter', authMiddleware, purchaseController.acceptCounterOffer);
app.get('/api/purchases/history', authMiddleware, purchaseController.getPurchaseHistory);
app.get('/api/purchases/stats', authMiddleware, purchaseController.getOfferStats);

// Investment pool routes
app.post('/api/investment-pools', authMiddleware, investmentPoolController.createPool);
app.get('/api/investment-pools/users/:userId/pools', authMiddleware, investmentPoolController.getUserPools);
app.post('/api/investment-pools/:poolId/add-funds', authMiddleware, investmentPoolController.addFunds);
app.post('/api/investment-pools/:poolId/withdraw', authMiddleware, investmentPoolController.withdrawFunds);
app.get('/api/investment-pools/:poolId/returns', authMiddleware, investmentPoolController.calculateReturns);
app.post('/api/investment-pools/:poolId/distribute-returns', authMiddleware, investmentPoolController.distributeReturns);
app.get('/api/investment-pools/herd/performance', investmentPoolController.getHerdPerformance);
app.post('/api/investment-pools/automatic/rebalance', authMiddleware, investmentPoolController.processAutomaticRebalancing);
app.get('/api/investment-pools/stats', authMiddleware, investmentPoolController.getPoolStatistics);

// User address routes
app.post('/api/user-addresses', authMiddleware, userAddressController.createAddress);
app.get('/api/user-addresses/users/:userId', authMiddleware, userAddressController.getUserAddresses);
app.get('/api/user-addresses/:addressId', authMiddleware, userAddressController.getAddressById);
app.put('/api/user-addresses/:addressId', authMiddleware, userAddressController.updateAddress);
app.delete('/api/user-addresses/:addressId', authMiddleware, userAddressController.deleteAddress);
app.put('/api/user-addresses/:addressId/default', authMiddleware, userAddressController.setDefaultAddress);
app.post('/api/user-addresses/:addressId/verify', authMiddleware, userAddressController.verifyAddress);
app.post('/api/user-addresses/calculate-shipping', userAddressController.calculateShippingCost);
app.get('/api/user-addresses/stats', authMiddleware, userAddressController.getAddressStatistics);

// User routes
app.post('/api/users/register', userController.register);
app.post('/api/users/login', userController.login);
app.post('/api/users/logout', authMiddleware, userController.logout);
app.get('/api/users/profile', authMiddleware, userController.getProfile);
app.put('/api/users/profile', authMiddleware, userController.updateProfile);
app.put('/api/users/password', authMiddleware, userController.changePassword);
app.post('/api/users/forgot-password', userController.forgotPassword);
app.post('/api/users/reset-password', userController.resetPassword);
app.get('/api/users/:userId', userController.getUserById);
app.get('/api/users/stats', authMiddleware, userController.getUserStatistics);

// Shipping routes
app.post('/api/shipping/routes', authMiddleware, shippingController.createRoute);
app.get('/api/shipping/routes', authMiddleware, shippingController.getRoutes);
app.get('/api/shipping/routes/:routeId', authMiddleware, shippingController.getRouteById);
app.put('/api/shipping/routes/:routeId', authMiddleware, shippingController.updateRoute);
app.delete('/api/shipping/routes/:routeId', authMiddleware, shippingController.deleteRoute);
app.post('/api/shipping/routes/:routeId/start', authMiddleware, shippingController.startShipping);
app.post('/api/shipping/routes/:routeId/complete', authMiddleware, shippingController.completeShipping);
app.post('/api/shipping/routes/:routeId/cancel', authMiddleware, shippingController.cancelShipping);
app.get('/api/shipping/stats', authMiddleware, shippingController.getShippingStatistics);

// Backup and Warehouse routes
app.post('/api/backups', authMiddleware, backupController.createBackup);
app.get('/api/backups', authMiddleware, backupController.getBackups);
app.get('/api/backups/:backupId', authMiddleware, backupController.getBackupDetails);
app.post('/api/backups/:backupId/restore', authMiddleware, backupController.restoreBackup);
app.delete('/api/backups/:backupId', authMiddleware, backupController.deleteBackup);
app.get('/api/backups/stats', authMiddleware, backupController.getBackupStats);
app.get('/api/warehouse/stats', authMiddleware, backupController.getWarehouseStats);
app.post('/api/warehouse/lifecycle', authMiddleware, backupController.triggerWarehouseLifecycle);
app.get('/api/audit/compliance', authMiddleware, backupController.getAuditComplianceReport);
app.get('/api/backups/:backupId/audit-export', authMiddleware, backupController.exportBackupForAudit);

// Cryptocurrency and OAuth2 routes
app.post('/api/crypto/payments', authMiddleware, cryptoController.createCryptoPayment);
app.get('/api/crypto/payments/status/:chargeId', authMiddleware, cryptoController.getPaymentStatus);
app.get('/api/crypto/payments/history', authMiddleware, cryptoController.getUserCryptoPayments);
app.get('/api/crypto/supported', cryptoController.getSupportedCryptocurrencies);
app.post('/api/crypto/webhook', cryptoController.handleWebhook);

// OAuth2 routes
app.get('/api/crypto/oauth/:provider/url', authMiddleware, cryptoController.generateOAuthURL);
app.get('/api/crypto/oauth/:provider/callback', cryptoController.handleOAuthCallback);
app.get('/api/crypto/oauth/credentials', authMiddleware, cryptoController.getUserOAuthCredentials);
app.delete('/api/crypto/oauth/credentials/:credentialId', authMiddleware, cryptoController.revokeOAuthCredentials);
app.post('/api/crypto/oauth/credentials/:credentialId/refresh', authMiddleware, cryptoController.refreshAccessToken);

// Cryptocurrency analytics
app.get('/api/crypto/analytics', authMiddleware, cryptoController.getCryptoAnalytics);
app.get('/api/crypto/oauth/analytics', authMiddleware, cryptoController.getOAuthAnalytics);

// Tax routes - Consumer endpoints
app.get('/api/tax/consumer/info', authMiddleware, taxController.getConsumerTaxInfo);
app.get('/api/tax/consumer/breakdown', authMiddleware, taxController.getConsumerTaxBreakdown);
app.get('/api/tax/consumer/summary', authMiddleware, taxController.getConsumerTaxSummary);
app.get('/api/tax/consumer/export', authMiddleware, taxController.exportTaxData);
app.get('/api/tax/rates', taxController.getTaxRates);

// Tax routes - Business/Admin endpoints
app.get('/api/tax/business/info', authMiddleware, taxController.getBusinessTaxInfo);
app.get('/api/tax/business/analytics', authMiddleware, taxController.getBusinessRevenueAnalytics);
app.get('/api/tax/business/compliance', authMiddleware, taxController.getTaxComplianceReport);

// Admin routes (protected by admin middleware)
app.get('/api/admin/users', authMiddleware, userController.getAllUsers);
app.put('/api/admin/users/:userId/status', authMiddleware, userController.updateUserStatus);
app.get('/api/admin/stats', authMiddleware, userController.getAdminStatistics);
app.post('/api/admin/investment-pools/rebalance', authMiddleware, investmentPoolController.adminRebalance);
app.post('/api/admin/system/maintenance', authMiddleware, userController.systemMaintenance);

// Error handling middleware
app.use(errorHandler);

// Catch-all route for SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Initialize services
const investmentPoolService = new InvestmentPoolService();
const userAddressService = new UserAddressService();
const backupService = new BackupService();
const warehouseService = new WarehouseService();
const coinbaseCommerceService = new CoinbaseCommerceService();
const oAuth2Service = new OAuth2Service();
const taxService = new TaxService();

// Cron jobs for automated tasks
function setupCronJobs() {
    // Process expired holds every hour
    cron.schedule('0 * * * *', async () => {
        console.log('Processing expired holds...');
        await holdController.processExpiredHolds();
    });

    // Calculate investment returns daily at 2 AM
    cron.schedule('0 2 * * *', async () => {
        console.log('Calculating investment returns...');
        try {
            await investmentPoolService.calculateAndDistributeReturns();
        } catch (error) {
            console.error('Error calculating investment returns:', error);
        }
    });

    // Process automatic rebalancing every 6 hours
    cron.schedule('0 */6 * * *', async () => {
        console.log('Processing automatic rebalancing...');
        try {
            await investmentPoolService.processAutomaticRebalancing();
        } catch (error) {
            console.error('Error processing automatic rebalancing:', error);
        }
    });

    // Update shipping status every 30 minutes
    cron.schedule('*/30 * * * *', async () => {
        console.log('Updating shipping status...');
        try {
            // This would update shipping statuses based on tracking information
            // Implementation depends on shipping provider integration
        } catch (error) {
            console.error('Error updating shipping status:', error);
        }
    });

    // Create automated backups daily at 3 AM
    cron.schedule('0 3 * * *', async () => {
        console.log('Creating automated backup...');
        try {
            await backupService.createSystemBackup();
        } catch (error) {
            console.error('Error creating automated backup:', error);
        }
    });

    // Manage warehouse lifecycle daily at 4 AM
    cron.schedule('0 4 * * *', async () => {
        console.log('Managing warehouse lifecycle...');
        try {
            await warehouseService.manageTierLifecycle();
        } catch (error) {
            console.error('Error managing warehouse lifecycle:', error);
        }
    });

    // Clean up old backups weekly on Sunday at 5 AM
    cron.schedule('0 5 * * 0', async () => {
        console.log('Cleaning up old backups...');
        try {
            await backupService.cleanupOldBackups();
        } catch (error) {
            console.error('Error cleaning up old backups:', error);
        }
    });

    // Verify data integrity weekly on Monday at 6 AM
    cron.schedule('0 6 * * 1', async () => {
        console.log('Verifying data integrity...');
        try {
            await warehouseService.verifyDataIntegrity();
        } catch (error) {
            console.error('Error verifying data integrity:', error);
        }
    });

    // Generate compliance reports monthly on the 1st at 7 AM
    cron.schedule('0 7 1 * *', async () => {
        console.log('Generating compliance reports...');
        try {
            await warehouseService.generateComplianceReport();
        } catch (error) {
            console.error('Error generating compliance reports:', error);
        }
    });

    console.log('Cron jobs scheduled successfully');
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    if (connection) {
        await connection.close();
    }
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('SIGINT received, shutting down gracefully...');
    if (connection) {
        await connection.close();
    }
    process.exit(0);
});

// Start server
async function startServer() {
    try {
        await initializeDatabase();
        setupCronJobs();
        
        app.listen(PORT, () => {
            console.log(`🚀 Inventory System API running on port ${PORT}`);
            console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔗 API Base URL: http://localhost:${PORT}/api`);
            console.log(`🌐 Web Interface: http://localhost:${PORT}`);
            console.log(`