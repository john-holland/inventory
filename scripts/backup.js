#!/usr/bin/env node

"use strict";

const BackupService = require('../server/services/backupService');
const WarehouseService = require('../server/services/warehouseService');
const { createConnection } = require('typeorm');
const entities = require('../server/entities');

// Command line arguments
const args = process.argv.slice(2);
const command = args[0];
const options = {};

// Parse options
for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith('--')) {
        const [key, value] = arg.slice(2).split('=');
        options[key] = value || true;
    }
}

async function initializeDatabase() {
    try {
        await createConnection({
            type: 'postgres',
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            username: process.env.DB_USER || 'postgres',
            password: process.env.DB_PASSWORD || 'password',
            database: process.env.DB_NAME || 'inventory_system',
            entities: entities,
            synchronize: false,
            logging: false
        });
        console.log('✅ Database connected');
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        process.exit(1);
    }
}

async function createBackup() {
    try {
        console.log('🔄 Creating system backup...');
        
        const backupService = new BackupService();
        const result = await backupService.createSystemBackup();
        
        console.log('✅ Backup created successfully');
        console.log(`📦 Backup ID: ${result.backupId}`);
        console.log(`📊 Size: ${(result.manifest.components.reduce((sum, comp) => sum + comp.size, 0) / 1024 / 1024).toFixed(2)} MB`);
        console.log(`🔗 Location: ${result.archivePath}`);
        
        return result;
    } catch (error) {
        console.error('❌ Backup creation failed:', error.message);
        process.exit(1);
    }
}

async function restoreBackup() {
    const backupId = options.backupId;
    if (!backupId) {
        console.error('❌ Backup ID is required. Use --backupId=<id>');
        process.exit(1);
    }

    try {
        console.log(`🔄 Restoring backup: ${backupId}`);
        
        const backupService = new BackupService();
        const result = await backupService.restoreFromBackup(backupId, {
            database: options.database !== 'false',
            uploads: options.uploads !== 'false',
            config: options.config !== 'false'
        });
        
        console.log('✅ Backup restored successfully');
        console.log(`📦 Restored components: ${Object.keys(result).join(', ')}`);
        
        return result;
    } catch (error) {
        console.error('❌ Backup restore failed:', error.message);
        process.exit(1);
    }
}

async function listBackups() {
    try {
        console.log('📋 Listing backups...');
        
        const backupService = new BackupService();
        const registryPath = path.join(backupService.backupConfig.localPath, 'backup_registry.json');
        
        if (!await backupService.fileExists(registryPath)) {
            console.log('📭 No backups found');
            return;
        }

        const registryContent = await fs.readFile(registryPath, 'utf8');
        const backups = JSON.parse(registryContent);

        console.log(`📊 Found ${backups.length} backups:\n`);
        
        backups.forEach((backup, index) => {
            const sizeMB = (backup.size / 1024 / 1024).toFixed(2);
            const date = new Date(backup.timestamp).toLocaleString();
            
            console.log(`${index + 1}. ${backup.backupId}`);
            console.log(`   📅 Date: ${date}`);
            console.log(`   📦 Type: ${backup.type}`);
            console.log(`   📊 Size: ${sizeMB} MB`);
            console.log(`   📍 Location: ${backup.location}`);
            console.log(`   ✅ Status: ${backup.status}`);
            console.log('');
        });
        
    } catch (error) {
        console.error('❌ Error listing backups:', error.message);
        process.exit(1);
    }
}

async function verifyIntegrity() {
    try {
        console.log('🔍 Verifying data integrity...');
        
        const warehouseService = new WarehouseService();
        const report = await warehouseService.verifyDataIntegrity();
        
        console.log('✅ Integrity verification completed');
        console.log(`📊 Total records: ${report.totalRecords}`);
        console.log(`✅ Verified: ${report.verifiedRecords}`);
        console.log(`❌ Failed: ${report.failedRecords}`);
        
        if (report.errors.length > 0) {
            console.log('\n❌ Errors found:');
            report.errors.forEach(error => {
                console.log(`   - ${error.dataId}: ${error.error}`);
            });
        }
        
        return report;
    } catch (error) {
        console.error('❌ Integrity verification failed:', error.message);
        process.exit(1);
    }
}

async function cleanupBackups() {
    try {
        console.log('🧹 Cleaning up old backups...');
        
        const backupService = new BackupService();
        await backupService.cleanupOldBackups();
        
        console.log('✅ Backup cleanup completed');
        
    } catch (error) {
        console.error('❌ Backup cleanup failed:', error.message);
        process.exit(1);
    }
}

async function generateAuditReport() {
    try {
        console.log('📋 Generating audit compliance report...');
        
        const warehouseService = new WarehouseService();
        const report = await warehouseService.generateComplianceReport();
        
        console.log('✅ Audit report generated');
        console.log(`📊 Compliance status:`);
        console.log(`   - Data Retention: ${report.compliance.dataRetention.compliant}/${report.compliance.dataRetention.compliant + report.compliance.dataRetention.nonCompliant} compliant`);
        console.log(`   - Data Encryption: ${report.compliance.dataEncryption.compliant}/${report.compliance.dataEncryption.compliant + report.compliance.dataEncryption.nonCompliant} compliant`);
        console.log(`   - Access Logging: ${report.compliance.accessLogging.compliant}/${report.compliance.accessLogging.compliant + report.compliance.accessLogging.nonCompliant} compliant`);
        console.log(`   - Audit Trail: ${report.compliance.auditTrail.compliant}/${report.compliance.auditTrail.compliant + report.compliance.auditTrail.nonCompliant} compliant`);
        
        if (report.recommendations.length > 0) {
            console.log('\n💡 Recommendations:');
            report.recommendations.forEach(rec => {
                console.log(`   - ${rec}`);
            });
        }
        
        return report;
    } catch (error) {
        console.error('❌ Audit report generation failed:', error.message);
        process.exit(1);
    }
}

async function manageWarehouse() {
    try {
        console.log('🏭 Managing warehouse lifecycle...');
        
        const warehouseService = new WarehouseService();
        await warehouseService.manageTierLifecycle();
        
        console.log('✅ Warehouse lifecycle management completed');
        
    } catch (error) {
        console.error('❌ Warehouse management failed:', error.message);
        process.exit(1);
    }
}

async function showHelp() {
    console.log(`
🔧 Inventory System Backup & Warehouse Management Tool

Usage: node scripts/backup.js <command> [options]

Commands:
  create              Create a new system backup
  restore             Restore from backup (requires --backupId)
  list                List all available backups
  verify              Verify data integrity
  cleanup             Clean up old backups
  audit               Generate audit compliance report
  warehouse           Manage warehouse lifecycle
  help                Show this help message

Options:
  --backupId=<id>     Backup ID for restore operations
  --database=true     Include database in restore (default: true)
  --uploads=true      Include uploads in restore (default: true)
  --config=true       Include config in restore (default: true)

Examples:
  node scripts/backup.js create
  node scripts/backup.js restore --backupId=backup_1234567890_abcdef12
  node scripts/backup.js list
  node scripts/backup.js verify
  node scripts/backup.js audit
  node scripts/backup.js warehouse

Environment Variables:
  DB_HOST             Database host (default: localhost)
  DB_PORT             Database port (default: 5432)
  DB_USER             Database user (default: postgres)
  DB_PASSWORD         Database password (default: password)
  DB_NAME             Database name (default: inventory_system)
  BACKUP_LOCAL_PATH   Local backup path (default: ./backups)
  WAREHOUSE_PATH      Warehouse path (default: ./warehouse)
  AWS_S3_BACKUP_BUCKET S3 bucket for backups
  AWS_S3_WAREHOUSE_BUCKET S3 bucket for warehouse
  AWS_ACCESS_KEY_ID   AWS access key
  AWS_SECRET_ACCESS_KEY AWS secret key
  AWS_S3_REGION       AWS region (default: us-east-1)
    `);
}

async function main() {
    try {
        // Load environment variables
        require('dotenv').config();

        // Initialize database connection
        await initializeDatabase();

        // Execute command
        switch (command) {
            case 'create':
                await createBackup();
                break;
            case 'restore':
                await restoreBackup();
                break;
            case 'list':
                await listBackups();
                break;
            case 'verify':
                await verifyIntegrity();
                break;
            case 'cleanup':
                await cleanupBackups();
                break;
            case 'audit':
                await generateAuditReport();
                break;
            case 'warehouse':
                await manageWarehouse();
                break;
            case 'help':
            case '--help':
            case '-h':
                await showHelp();
                break;
            default:
                console.error('❌ Unknown command:', command);
                console.log('Use "node scripts/backup.js help" for usage information');
                process.exit(1);
        }

        console.log('\n🎉 Operation completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Fatal error:', error.message);
        process.exit(1);
    }
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = {
    createBackup,
    restoreBackup,
    listBackups,
    verifyIntegrity,
    cleanupBackups,
    generateAuditReport,
    manageWarehouse
}; 