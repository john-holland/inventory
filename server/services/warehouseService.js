"use strict";

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { createReadStream, createWriteStream } = require('fs');
const archiver = require('archiver');
const AWS = require('aws-sdk');
const { getRepository } = require('typeorm');
const { getCoefficient } = require('../config/ConstantMarketCoefficients');

class WarehouseService {
    constructor() {
        this.warehouseConfig = {
            basePath: process.env.WAREHOUSE_PATH || './warehouse',
            tiers: {
                hot: {
                    path: './warehouse/hot',
                    retentionDays: getCoefficient('HOT_TIER_RETENTION_DAYS', 30),
                    compression: false,
                    encryption: false
                },
                warm: {
                    path: './warehouse/warm',
                    retentionDays: getCoefficient('WARM_TIER_RETENTION_DAYS', 365),
                    compression: true,
                    encryption: true
                },
                cold: {
                    path: './warehouse/cold',
                    retentionDays: getCoefficient('COLD_TIER_RETENTION_DAYS', 2555), // 7 years
                    compression: true,
                    encryption: true,
                    s3Enabled: true
                },
                archive: {
                    path: './warehouse/archive',
                    retentionDays: getCoefficient('ARCHIVE_TIER_RETENTION_DAYS', 3650), // 10 years
                    compression: true,
                    encryption: true,
                    s3Enabled: true,
                    glacierEnabled: true
                }
            },
            encryptionKey: process.env.WAREHOUSE_ENCRYPTION_KEY || crypto.randomBytes(32),
            s3Bucket: process.env.AWS_S3_WAREHOUSE_BUCKET,
            glacierVault: process.env.AWS_GLACIER_VAULT,
            s3Region: process.env.AWS_S3_REGION || 'us-east-1'
        };

        // Initialize AWS services if configured
        if (this.warehouseConfig.s3Bucket) {
            this.s3 = new AWS.S3({
                region: this.warehouseConfig.s3Region,
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
            });
        }

        if (this.warehouseConfig.glacierVault) {
            this.glacier = new AWS.Glacier({
                region: this.warehouseConfig.s3Region,
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
            });
        }

        this.initializeWarehouse();
    }

    async initializeWarehouse() {
        try {
            // Create warehouse directory structure
            for (const [tierName, tierConfig] of Object.entries(this.warehouseConfig.tiers)) {
                await fs.mkdir(tierConfig.path, { recursive: true });
                await fs.mkdir(path.join(tierConfig.path, 'data'), { recursive: true });
                await fs.mkdir(path.join(tierConfig.path, 'metadata'), { recursive: true });
                await fs.mkdir(path.join(tierConfig.path, 'index'), { recursive: true });
            }

            // Create audit and compliance directories
            await fs.mkdir(path.join(this.warehouseConfig.basePath, 'audit'), { recursive: true });
            await fs.mkdir(path.join(this.warehouseConfig.basePath, 'compliance'), { recursive: true });
            await fs.mkdir(path.join(this.warehouseConfig.basePath, 'reports'), { recursive: true });

            console.log('Warehouse initialized successfully');

        } catch (error) {
            console.error('Warehouse initialization failed:', error);
        }
    }

    // Store data with automatic tiering
    async storeData(data, metadata = {}, options = {}) {
        const dataId = this.generateDataId();
        const timestamp = new Date().toISOString();
        
        try {
            // Determine initial tier based on data type and access patterns
            const initialTier = this.determineInitialTier(metadata, options);
            
            // Create data package
            const dataPackage = {
                id: dataId,
                timestamp,
                tier: initialTier,
                metadata: {
                    ...metadata,
                    originalSize: Buffer.byteLength(JSON.stringify(data)),
                    checksum: this.calculateChecksum(data),
                    version: '2.0.0'
                },
                data: data
            };

            // Store in appropriate tier
            await this.storeInTier(dataPackage, initialTier);

            // Create audit trail
            await this.createAuditTrail(dataId, 'store', initialTier, metadata);

            // Update warehouse index
            await this.updateWarehouseIndex(dataId, dataPackage);

            console.log(`Data stored successfully: ${dataId} in tier ${initialTier}`);
            return { dataId, tier: initialTier };

        } catch (error) {
            console.error(`Data storage failed: ${dataId}`, error);
            await this.logWarehouseError(dataId, error);
            throw error;
        }
    }

    // Retrieve data with automatic tier promotion
    async retrieveData(dataId, options = {}) {
        try {
            // Find data in warehouse index
            const dataLocation = await this.findDataLocation(dataId);
            if (!dataLocation) {
                throw new Error(`Data ${dataId} not found`);
            }

            // Retrieve from current tier
            const data = await this.retrieveFromTier(dataId, dataLocation.tier);

            // Promote to hot tier if frequently accessed
            if (options.promote !== false) {
                await this.promoteToHotTier(dataId, dataLocation);
            }

            // Update access metrics
            await this.updateAccessMetrics(dataId);

            // Create audit trail
            await this.createAuditTrail(dataId, 'retrieve', dataLocation.tier, {});

            return data;

        } catch (error) {
            console.error(`Data retrieval failed: ${dataId}`, error);
            throw error;
        }
    }

    // Store data in specific tier
    async storeInTier(dataPackage, tierName) {
        const tierConfig = this.warehouseConfig.tiers[tierName];
        const tierPath = tierConfig.path;

        try {
            let processedData = dataPackage.data;

            // Compress if required
            if (tierConfig.compression) {
                processedData = await this.compressData(processedData);
            }

            // Encrypt if required
            if (tierConfig.encryption) {
                processedData = await this.encryptData(processedData, dataPackage.id);
            }

            // Store data file
            const dataPath = path.join(tierPath, 'data', `${dataPackage.id}.dat`);
            await fs.writeFile(dataPath, processedData);

            // Store metadata
            const metadataPath = path.join(tierPath, 'metadata', `${dataPackage.id}.json`);
            await fs.writeFile(metadataPath, JSON.stringify(dataPackage.metadata, null, 2));

            // Upload to S3 if enabled for this tier
            if (tierConfig.s3Enabled && this.s3) {
                await this.uploadToS3(dataPath, dataPackage.id, tierName);
            }

            // Upload to Glacier if enabled for this tier
            if (tierConfig.glacierEnabled && this.glacier) {
                await this.uploadToGlacier(dataPath, dataPackage.id);
            }

        } catch (error) {
            console.error(`Tier storage failed: ${dataPackage.id} in ${tierName}`, error);
            throw error;
        }
    }

    // Retrieve data from specific tier
    async retrieveFromTier(dataId, tierName) {
        const tierConfig = this.warehouseConfig.tiers[tierName];
        const tierPath = tierConfig.path;

        try {
            let dataPath = path.join(tierPath, 'data', `${dataId}.dat`);

            // Download from S3 if not available locally
            if (!await this.fileExists(dataPath) && tierConfig.s3Enabled && this.s3) {
                dataPath = await this.downloadFromS3(dataId, tierName);
            }

            // Download from Glacier if not available locally or in S3
            if (!await this.fileExists(dataPath) && tierConfig.glacierEnabled && this.glacier) {
                dataPath = await this.downloadFromGlacier(dataId);
            }

            if (!await this.fileExists(dataPath)) {
                throw new Error(`Data file not found: ${dataId}`);
            }

            let data = await fs.readFile(dataPath);

            // Decrypt if required
            if (tierConfig.encryption) {
                data = await this.decryptData(data, dataId);
            }

            // Decompress if required
            if (tierConfig.compression) {
                data = await this.decompressData(data);
            }

            return JSON.parse(data.toString());

        } catch (error) {
            console.error(`Tier retrieval failed: ${dataId} from ${tierName}`, error);
            throw error;
        }
    }

    // Promote data to hot tier
    async promoteToHotTier(dataId, dataLocation) {
        try {
            // Check access frequency
            const accessCount = await this.getAccessCount(dataId);
            const shouldPromote = accessCount > getCoefficient('PROMOTION_THRESHOLD', 10);

            if (shouldPromote && dataLocation.tier !== 'hot') {
                // Retrieve from current tier
                const data = await this.retrieveFromTier(dataId, dataLocation.tier);

                // Store in hot tier
                await this.storeInTier({ id: dataId, data, metadata: dataLocation.metadata }, 'hot');

                // Update location in index
                await this.updateDataLocation(dataId, 'hot');

                console.log(`Data promoted to hot tier: ${dataId}`);
            }

        } catch (error) {
            console.error(`Promotion failed: ${dataId}`, error);
        }
    }

    // Tier management and lifecycle
    async manageTierLifecycle() {
        try {
            console.log('Starting tier lifecycle management...');

            for (const [tierName, tierConfig] of Object.entries(this.warehouseConfig.tiers)) {
                await this.processTierLifecycle(tierName, tierConfig);
            }

            // Clean up expired data
            await this.cleanupExpiredData();

            // Generate compliance reports
            await this.generateComplianceReport();

            console.log('Tier lifecycle management completed');

        } catch (error) {
            console.error('Tier lifecycle management failed:', error);
        }
    }

    // Process lifecycle for specific tier
    async processTierLifecycle(tierName, tierConfig) {
        try {
            const tierPath = tierConfig.path;
            const metadataPath = path.join(tierPath, 'metadata');

            if (!await this.directoryExists(metadataPath)) return;

            const files = await fs.readdir(metadataPath);
            
            for (const file of files) {
                if (!file.endsWith('.json')) continue;

                const dataId = file.replace('.json', '');
                const metadataPath = path.join(tierPath, 'metadata', file);
                
                const metadataContent = await fs.readFile(metadataPath, 'utf8');
                const metadata = JSON.parse(metadataContent);

                const ageInDays = (Date.now() - new Date(metadata.timestamp).getTime()) / (1000 * 60 * 60 * 24);

                // Move to next tier if expired
                if (ageInDays > tierConfig.retentionDays) {
                    await this.moveToNextTier(dataId, tierName, metadata);
                }
            }

        } catch (error) {
            console.error(`Tier lifecycle processing failed for ${tierName}:`, error);
        }
    }

    // Move data to next tier
    async moveToNextTier(dataId, currentTier, metadata) {
        try {
            const tierOrder = ['hot', 'warm', 'cold', 'archive'];
            const currentIndex = tierOrder.indexOf(currentTier);
            
            if (currentIndex >= tierOrder.length - 1) {
                // Data is in final tier, mark for deletion
                await this.markForDeletion(dataId);
                return;
            }

            const nextTier = tierOrder[currentIndex + 1];

            // Retrieve from current tier
            const data = await this.retrieveFromTier(dataId, currentTier);

            // Store in next tier
            await this.storeInTier({ id: dataId, data, metadata }, nextTier);

            // Update location
            await this.updateDataLocation(dataId, nextTier);

            // Remove from current tier
            await this.removeFromTier(dataId, currentTier);

            console.log(`Data moved from ${currentTier} to ${nextTier}: ${dataId}`);

        } catch (error) {
            console.error(`Tier movement failed: ${dataId}`, error);
        }
    }

    // Data integrity and compliance
    async verifyDataIntegrity() {
        try {
            console.log('Starting data integrity verification...');

            const integrityReport = {
                timestamp: new Date().toISOString(),
                totalRecords: 0,
                verifiedRecords: 0,
                failedRecords: 0,
                errors: []
            };

            // Check all tiers
            for (const [tierName, tierConfig] of Object.entries(this.warehouseConfig.tiers)) {
                const tierReport = await this.verifyTierIntegrity(tierName, tierConfig);
                
                integrityReport.totalRecords += tierReport.totalRecords;
                integrityReport.verifiedRecords += tierReport.verifiedRecords;
                integrityReport.failedRecords += tierReport.failedRecords;
                integrityReport.errors.push(...tierReport.errors);
            }

            // Save integrity report
            const reportPath = path.join(this.warehouseConfig.basePath, 'reports', `integrity_${Date.now()}.json`);
            await fs.writeFile(reportPath, JSON.stringify(integrityReport, null, 2));

            console.log(`Integrity verification completed: ${integrityReport.verifiedRecords}/${integrityReport.totalRecords} records verified`);

            return integrityReport;

        } catch (error) {
            console.error('Data integrity verification failed:', error);
            throw error;
        }
    }

    // Verify integrity of specific tier
    async verifyTierIntegrity(tierName, tierConfig) {
        const report = {
            tier: tierName,
            totalRecords: 0,
            verifiedRecords: 0,
            failedRecords: 0,
            errors: []
        };

        try {
            const metadataPath = path.join(tierConfig.path, 'metadata');
            
            if (!await this.directoryExists(metadataPath)) return report;

            const files = await fs.readdir(metadataPath);
            
            for (const file of files) {
                if (!file.endsWith('.json')) continue;

                report.totalRecords++;
                const dataId = file.replace('.json', '');

                try {
                    // Verify data file exists
                    const dataPath = path.join(tierConfig.path, 'data', `${dataId}.dat`);
                    if (!await this.fileExists(dataPath)) {
                        throw new Error('Data file missing');
                    }

                    // Verify checksum
                    const data = await this.retrieveFromTier(dataId, tierName);
                    const expectedChecksum = await this.getExpectedChecksum(dataId);
                    const actualChecksum = this.calculateChecksum(data);

                    if (expectedChecksum !== actualChecksum) {
                        throw new Error('Checksum mismatch');
                    }

                    report.verifiedRecords++;

                } catch (error) {
                    report.failedRecords++;
                    report.errors.push({
                        dataId,
                        error: error.message
                    });
                }
            }

        } catch (error) {
            console.error(`Tier integrity verification failed for ${tierName}:`, error);
        }

        return report;
    }

    // Generate compliance report
    async generateComplianceReport() {
        try {
            const report = {
                timestamp: new Date().toISOString(),
                compliance: {
                    dataRetention: await this.checkRetentionCompliance(),
                    dataEncryption: await this.checkEncryptionCompliance(),
                    accessLogging: await this.checkAccessLoggingCompliance(),
                    auditTrail: await this.checkAuditTrailCompliance()
                },
                statistics: await this.getWarehouseStatistics(),
                recommendations: []
            };

            // Generate recommendations
            if (report.compliance.dataRetention.nonCompliant > 0) {
                report.recommendations.push('Review data retention policies for expired data');
            }

            if (report.compliance.dataEncryption.nonCompliant > 0) {
                report.recommendations.push('Encrypt sensitive data in warm and cold tiers');
            }

            // Save compliance report
            const reportPath = path.join(this.warehouseConfig.basePath, 'compliance', `compliance_${Date.now()}.json`);
            await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

            return report;

        } catch (error) {
            console.error('Compliance report generation failed:', error);
            throw error;
        }
    }

    // Utility methods
    generateDataId() {
        return `data_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    }

    calculateChecksum(data) {
        return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
    }

    determineInitialTier(metadata, options) {
        // Determine tier based on data type and access patterns
        if (options.tier) return options.tier;
        
        if (metadata.dataType === 'transaction' || metadata.dataType === 'user') {
            return 'hot';
        } else if (metadata.dataType === 'analytics' || metadata.dataType === 'report') {
            return 'warm';
        } else if (metadata.dataType === 'archive' || metadata.dataType === 'backup') {
            return 'cold';
        } else {
            return 'warm';
        }
    }

    async compressData(data) {
        // Simple compression - in production, use proper compression libraries
        return Buffer.from(JSON.stringify(data).replace(/\s+/g, ''));
    }

    async decompressData(data) {
        // Simple decompression
        return data;
    }

    async encryptData(data, dataId) {
        const algorithm = 'aes-256-gcm';
        const key = crypto.scryptSync(this.warehouseConfig.encryptionKey, 'salt', 32);
        const iv = crypto.randomBytes(16);

        const cipher = crypto.createCipher(algorithm, key);
        cipher.setAAD(Buffer.from(dataId));

        const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
        const authTag = cipher.getAuthTag();

        return Buffer.concat([iv, authTag, encrypted]);
    }

    async decryptData(encryptedData, dataId) {
        const algorithm = 'aes-256-gcm';
        const key = crypto.scryptSync(this.warehouseConfig.encryptionKey, 'salt', 32);
        
        const iv = encryptedData.slice(0, 16);
        const authTag = encryptedData.slice(16, 32);
        const encrypted = encryptedData.slice(32);

        const decipher = crypto.createDecipher(algorithm, key);
        decipher.setAuthTag(authTag);
        decipher.setAAD(Buffer.from(dataId));

        return Buffer.concat([decipher.update(encrypted), decipher.final()]);
    }

    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    async directoryExists(dirPath) {
        try {
            const stat = await fs.stat(dirPath);
            return stat.isDirectory();
        } catch {
            return false;
        }
    }

    async createAuditTrail(dataId, action, tier, metadata) {
        const auditEntry = {
            dataId,
            action,
            tier,
            timestamp: new Date().toISOString(),
            metadata
        };

        const auditPath = path.join(this.warehouseConfig.basePath, 'audit', 'audit_trail.json');
        let auditTrail = [];
        
        if (await this.fileExists(auditPath)) {
            const auditContent = await fs.readFile(auditPath, 'utf8');
            auditTrail = JSON.parse(auditContent);
        }

        auditTrail.push(auditEntry);
        await fs.writeFile(auditPath, JSON.stringify(auditTrail, null, 2));
    }

    async logWarehouseError(dataId, error) {
        const errorLog = {
            dataId,
            timestamp: new Date().toISOString(),
            error: error.message,
            stack: error.stack
        };

        const errorPath = path.join(this.warehouseConfig.basePath, 'audit', 'warehouse_errors.json');
        let errorLogs = [];
        
        if (await this.fileExists(errorPath)) {
            const errorContent = await fs.readFile(errorPath, 'utf8');
            errorLogs = JSON.parse(errorContent);
        }

        errorLogs.push(errorLog);
        await fs.writeFile(errorPath, JSON.stringify(errorLogs, null, 2));
    }

    // Placeholder methods for S3 and Glacier operations
    async uploadToS3(filePath, dataId, tierName) {
        // Implementation for S3 upload
        console.log(`Uploading to S3: ${dataId} in tier ${tierName}`);
    }

    async downloadFromS3(dataId, tierName) {
        // Implementation for S3 download
        console.log(`Downloading from S3: ${dataId} from tier ${tierName}`);
        return null;
    }

    async uploadToGlacier(filePath, dataId) {
        // Implementation for Glacier upload
        console.log(`Uploading to Glacier: ${dataId}`);
    }

    async downloadFromGlacier(dataId) {
        // Implementation for Glacier download
        console.log(`Downloading from Glacier: ${dataId}`);
        return null;
    }

    // Placeholder methods for index management
    async updateWarehouseIndex(dataId, dataPackage) {
        // Implementation for updating warehouse index
    }

    async findDataLocation(dataId) {
        // Implementation for finding data location
        return null;
    }

    async updateDataLocation(dataId, tier) {
        // Implementation for updating data location
    }

    async updateAccessMetrics(dataId) {
        // Implementation for updating access metrics
    }

    async getAccessCount(dataId) {
        // Implementation for getting access count
        return 0;
    }

    async getExpectedChecksum(dataId) {
        // Implementation for getting expected checksum
        return '';
    }

    async removeFromTier(dataId, tierName) {
        // Implementation for removing from tier
    }

    async markForDeletion(dataId) {
        // Implementation for marking for deletion
    }

    async cleanupExpiredData() {
        // Implementation for cleaning up expired data
    }

    async getWarehouseStatistics() {
        // Implementation for getting warehouse statistics
        return {};
    }

    async checkRetentionCompliance() {
        // Implementation for checking retention compliance
        return { compliant: 0, nonCompliant: 0 };
    }

    async checkEncryptionCompliance() {
        // Implementation for checking encryption compliance
        return { compliant: 0, nonCompliant: 0 };
    }

    async checkAccessLoggingCompliance() {
        // Implementation for checking access logging compliance
        return { compliant: 0, nonCompliant: 0 };
    }

    async checkAuditTrailCompliance() {
        // Implementation for checking audit trail compliance
        return { compliant: 0, nonCompliant: 0 };
    }
}

module.exports = WarehouseService; 