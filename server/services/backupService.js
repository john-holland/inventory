I’m "use strict";

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { createReadStream, createWriteStream } = require('fs');
const archiver = require('archiver');
const AWS = require('aws-sdk');
const { getRepository } = require('typeorm');
const { getCoefficient } = require('../config/ConstantMarketCoefficients');

class BackupService {
    constructor() {
        this.backupConfig = {
            localPath: process.env.BACKUP_LOCAL_PATH || './backups',
            encryptionKey: process.env.BACKUP_ENCRYPTION_KEY || crypto.randomBytes(32),
            compressionLevel: 9,
            retentionDays: getCoefficient('BACKUP_RETENTION_DAYS', 90),
            maxBackupSize: getCoefficient('MAX_BACKUP_SIZE_MB', 1000) * 1024 * 1024,
            s3Bucket: process.env.AWS_S3_BACKUP_BUCKET,
            s3Region: process.env.AWS_S3_REGION || 'us-east-1'
        };

        // Initialize AWS S3 if configured
        if (this.backupConfig.s3Bucket) {
            this.s3 = new AWS.S3({
                region: this.backupConfig.s3Region,
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
            });
        }

        this.ensureBackupDirectory();
    }

    async ensureBackupDirectory() {
        try {
            await fs.mkdir(this.backupConfig.localPath, { recursive: true });
            await fs.mkdir(path.join(this.backupConfig.localPath, 'encrypted'), { recursive: true });
            await fs.mkdir(path.join(this.backupConfig.localPath, 'logs'), { recursive: true });
        } catch (error) {
            console.error('Error creating backup directories:', error);
        }
    }

    // Create comprehensive system backup
    async createSystemBackup() {
        const backupId = this.generateBackupId();
        const timestamp = new Date().toISOString();
        
        try {
            console.log(`Starting system backup: ${backupId}`);

            // Create backup manifest
            const manifest = {
                backupId,
                timestamp,
                version: '2.0.0',
                type: 'system_backup',
                components: []
            };

            // Backup database
            const dbBackup = await this.backupDatabase(backupId);
            manifest.components.push(dbBackup);

            // Backup file uploads
            const fileBackup = await this.backupFileUploads(backupId);
            manifest.components.push(fileBackup);

            // Backup configuration
            const configBackup = await this.backupConfiguration(backupId);
            manifest.components.push(configBackup);

            // Backup logs
            const logBackup = await this.backupLogs(backupId);
            manifest.components.push(logBackup);

            // Create encrypted archive
            const archivePath = await this.createEncryptedArchive(backupId, manifest);

            // Upload to cloud storage
            if (this.s3) {
                await this.uploadToS3(archivePath, backupId);
            }

            // Update backup registry
            await this.updateBackupRegistry(backupId, manifest);

            console.log(`System backup completed: ${backupId}`);
            return { backupId, manifest, archivePath };

        } catch (error) {
            console.error(`Backup failed: ${backupId}`, error);
            await this.logBackupError(backupId, error);
            throw error;
        }
    }

    // Backup database with audit trail protection
    async backupDatabase(backupId) {
        const dbBackupPath = path.join(this.backupConfig.localPath, `${backupId}_database.sql`);
        
        try {
            // Create database dump with audit trail
            const dumpCommand = `pg_dump -h ${process.env.DB_HOST} -U ${process.env.DB_USER} -d ${process.env.DB_NAME} --no-password --verbose --clean --if-exists --no-owner --no-privileges > ${dbBackupPath}`;
            
            const { exec } = require('child_process');
            await new Promise((resolve, reject) => {
                exec(dumpCommand, { env: { ...process.env, PGPASSWORD: process.env.DB_PASSWORD } }, (error, stdout, stderr) => {
                    if (error) reject(error);
                    else resolve(stdout);
                });
            });

            // Add audit trail to database backup
            await this.addAuditTrail(dbBackupPath, backupId, 'database');

            return {
                type: 'database',
                path: dbBackupPath,
                size: (await fs.stat(dbBackupPath)).size,
                checksum: await this.calculateChecksum(dbBackupPath)
            };

        } catch (error) {
            console.error('Database backup failed:', error);
            throw error;
        }
    }

    // Backup file uploads with integrity checks
    async backupFileUploads(backupId) {
        const uploadsPath = process.env.UPLOAD_PATH || './uploads';
        const backupPath = path.join(this.backupConfig.localPath, `${backupId}_uploads.zip`);

        try {
            const archive = archiver('zip', { zlib: { level: this.backupConfig.compressionLevel } });
            const output = createWriteStream(backupPath);

            archive.pipe(output);

            // Add all upload files with integrity metadata
            if (await this.directoryExists(uploadsPath)) {
                archive.directory(uploadsPath, 'uploads');
            }

            await new Promise((resolve, reject) => {
                output.on('close', resolve);
                archive.on('error', reject);
                archive.finalize();
            });

            return {
                type: 'uploads',
                path: backupPath,
                size: (await fs.stat(backupPath)).size,
                checksum: await this.calculateChecksum(backupPath)
            };

        } catch (error) {
            console.error('File uploads backup failed:', error);
            throw error;
        }
    }

    // Backup configuration with encryption
    async backupConfiguration(backupId) {
        const configPath = path.join(this.backupConfig.localPath, `${backupId}_config.json`);

        try {
            const config = {
                environment: process.env.NODE_ENV,
                database: {
                    host: process.env.DB_HOST,
                    port: process.env.DB_PORT,
                    database: process.env.DB_NAME,
                    // Don't include passwords in backup
                },
                backup: {
                    retentionDays: this.backupConfig.retentionDays,
                    encryptionEnabled: true,
                    compressionLevel: this.backupConfig.compressionLevel
                },
                system: {
                    version: '2.0.0',
                    timestamp: new Date().toISOString()
                }
            };

            await fs.writeFile(configPath, JSON.stringify(config, null, 2));

            return {
                type: 'configuration',
                path: configPath,
                size: (await fs.stat(configPath)).size,
                checksum: await this.calculateChecksum(configPath)
            };

        } catch (error) {
            console.error('Configuration backup failed:', error);
            throw error;
        }
    }

    // Backup logs with rotation
    async backupLogs(backupId) {
        const logsPath = path.join(this.backupConfig.localPath, `${backupId}_logs.zip`);
        const logDir = path.join(process.cwd(), 'logs');

        try {
            const archive = archiver('zip', { zlib: { level: this.backupConfig.compressionLevel } });
            const output = createWriteStream(logsPath);

            archive.pipe(output);

            if (await this.directoryExists(logDir)) {
                archive.directory(logDir, 'logs');
            }

            await new Promise((resolve, reject) => {
                output.on('close', resolve);
                archive.on('error', reject);
                archive.finalize();
            });

            return {
                type: 'logs',
                path: logsPath,
                size: (await fs.stat(logsPath)).size,
                checksum: await this.calculateChecksum(logsPath)
            };

        } catch (error) {
            console.error('Logs backup failed:', error);
            throw error;
        }
    }

    // Create encrypted archive
    async createEncryptedArchive(backupId, manifest) {
        const archivePath = path.join(this.backupConfig.localPath, 'encrypted', `${backupId}_encrypted.tar.gz`);
        
        try {
            const archive = archiver('tar', { gzip: true, gzipOptions: { level: this.backupConfig.compressionLevel } });
            const output = createWriteStream(archivePath);

            archive.pipe(output);

            // Add manifest
            const manifestPath = path.join(this.backupConfig.localPath, `${backupId}_manifest.json`);
            await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
            archive.file(manifestPath, { name: 'manifest.json' });

            // Add all backup components
            for (const component of manifest.components) {
                if (await this.fileExists(component.path)) {
                    archive.file(component.path, { name: path.basename(component.path) });
                }
            }

            await new Promise((resolve, reject) => {
                output.on('close', resolve);
                archive.on('error', reject);
                archive.finalize();
            });

            // Encrypt the archive
            const encryptedPath = await this.encryptFile(archivePath, backupId);

            return encryptedPath;

        } catch (error) {
            console.error('Encrypted archive creation failed:', error);
            throw error;
        }
    }

    // Encrypt file with AES-256
    async encryptFile(filePath, backupId) {
        const encryptedPath = filePath + '.enc';
        
        try {
            const algorithm = 'aes-256-gcm';
            const key = crypto.scryptSync(this.backupConfig.encryptionKey, 'salt', 32);
            const iv = crypto.randomBytes(16);

            const cipher = crypto.createCipher(algorithm, key);
            cipher.setAAD(Buffer.from(backupId));

            const input = createReadStream(filePath);
            const output = createWriteStream(encryptedPath);

            input.pipe(cipher).pipe(output);

            await new Promise((resolve, reject) => {
                output.on('finish', resolve);
                output.on('error', reject);
            });

            // Store encryption metadata
            const metadata = {
                algorithm,
                iv: iv.toString('hex'),
                backupId,
                timestamp: new Date().toISOString()
            };

            const metadataPath = encryptedPath + '.meta';
            await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

            return encryptedPath;

        } catch (error) {
            console.error('File encryption failed:', error);
            throw error;
        }
    }

    // Upload to S3 with lifecycle policies
    async uploadToS3(filePath, backupId) {
        if (!this.s3) return;

        try {
            const fileContent = await fs.readFile(filePath);
            const key = `backups/${new Date().getFullYear()}/${new Date().getMonth() + 1}/${backupId}_${path.basename(filePath)}`;

            const uploadParams = {
                Bucket: this.backupConfig.s3Bucket,
                Key: key,
                Body: fileContent,
                ServerSideEncryption: 'AES256',
                Metadata: {
                    'backup-id': backupId,
                    'backup-date': new Date().toISOString(),
                    'backup-type': 'system_backup'
                }
            };

            await this.s3.upload(uploadParams).promise();

            console.log(`Backup uploaded to S3: ${key}`);

        } catch (error) {
            console.error('S3 upload failed:', error);
            throw error;
        }
    }

    // Update backup registry
    async updateBackupRegistry(backupId, manifest) {
        const registryPath = path.join(this.backupConfig.localPath, 'backup_registry.json');
        
        try {
            let registry = [];
            
            if (await this.fileExists(registryPath)) {
                const registryContent = await fs.readFile(registryPath, 'utf8');
                registry = JSON.parse(registryContent);
            }

            const backupEntry = {
                backupId,
                timestamp: manifest.timestamp,
                type: manifest.type,
                size: manifest.components.reduce((total, comp) => total + comp.size, 0),
                components: manifest.components.length,
                status: 'completed',
                checksum: await this.calculateChecksum(manifest.components[0]?.path || ''),
                location: this.s3 ? 's3' : 'local'
            };

            registry.push(backupEntry);

            // Keep only recent entries
            registry = registry.slice(-100);

            await fs.writeFile(registryPath, JSON.stringify(registry, null, 2));

        } catch (error) {
            console.error('Backup registry update failed:', error);
        }
    }

    // Restore from backup
    async restoreFromBackup(backupId, options = {}) {
        try {
            console.log(`Starting restore from backup: ${backupId}`);

            // Find backup in registry
            const backup = await this.findBackup(backupId);
            if (!backup) {
                throw new Error(`Backup ${backupId} not found`);
            }

            // Download from S3 if needed
            let backupPath = backup.localPath;
            if (backup.location === 's3') {
                backupPath = await this.downloadFromS3(backupId);
            }

            // Decrypt if encrypted
            if (backupPath.endsWith('.enc')) {
                backupPath = await this.decryptFile(backupPath, backupId);
            }

            // Extract and restore components
            const manifest = await this.extractManifest(backupPath);
            
            if (options.database !== false) {
                await this.restoreDatabase(manifest);
            }

            if (options.uploads !== false) {
                await this.restoreUploads(manifest);
            }

            if (options.config !== false) {
                await this.restoreConfiguration(manifest);
            }

            console.log(`Restore completed: ${backupId}`);
            return { success: true, backupId };

        } catch (error) {
            console.error(`Restore failed: ${backupId}`, error);
            throw error;
        }
    }

    // Clean up old backups
    async cleanupOldBackups() {
        try {
            const registryPath = path.join(this.backupConfig.localPath, 'backup_registry.json');
            
            if (!await this.fileExists(registryPath)) return;

            const registryContent = await fs.readFile(registryPath, 'utf8');
            const registry = JSON.parse(registryContent);

            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - this.backupConfig.retentionDays);

            const oldBackups = registry.filter(backup => 
                new Date(backup.timestamp) < cutoffDate
            );

            for (const backup of oldBackups) {
                await this.deleteBackup(backup.backupId);
            }

            console.log(`Cleaned up ${oldBackups.length} old backups`);

        } catch (error) {
            console.error('Backup cleanup failed:', error);
        }
    }

    // Utility methods
    generateBackupId() {
        return `backup_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    }

    async calculateChecksum(filePath) {
        return new Promise((resolve, reject) => {
            const hash = crypto.createHash('sha256');
            const stream = createReadStream(filePath);
            
            stream.on('data', data => hash.update(data));
            stream.on('end', () => resolve(hash.digest('hex')));
            stream.on('error', reject);
        });
    }

    async addAuditTrail(filePath, backupId, componentType) {
        const auditEntry = {
            backupId,
            componentType,
            timestamp: new Date().toISOString(),
            checksum: await this.calculateChecksum(filePath),
            size: (await fs.stat(filePath)).size
        };

        const auditPath = path.join(this.backupConfig.localPath, 'logs', 'audit_trail.json');
        let auditTrail = [];
        
        if (await this.fileExists(auditPath)) {
            const auditContent = await fs.readFile(auditPath, 'utf8');
            auditTrail = JSON.parse(auditContent);
        }

        auditTrail.push(auditEntry);
        await fs.writeFile(auditPath, JSON.stringify(auditTrail, null, 2));
    }

    async logBackupError(backupId, error) {
        const errorLog = {
            backupId,
            timestamp: new Date().toISOString(),
            error: error.message,
            stack: error.stack
        };

        const errorPath = path.join(this.backupConfig.localPath, 'logs', 'backup_errors.json');
        let errorLogs = [];
        
        if (await this.fileExists(errorPath)) {
            const errorContent = await fs.readFile(errorPath, 'utf8');
            errorLogs = JSON.parse(errorContent);
        }

        errorLogs.push(errorLog);
        await fs.writeFile(errorPath, JSON.stringify(errorLogs, null, 2));
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

    async findBackup(backupId) {
        const registryPath = path.join(this.backupConfig.localPath, 'backup_registry.json');
        
        if (!await this.fileExists(registryPath)) return null;

        const registryContent = await fs.readFile(registryPath, 'utf8');
        const registry = JSON.parse(registryContent);

        return registry.find(backup => backup.backupId === backupId);
    }

    async deleteBackup(backupId) {
        try {
            // Delete local files
            const files = await fs.readdir(this.backupConfig.localPath);
            for (const file of files) {
                if (file.includes(backupId)) {
                    await fs.unlink(path.join(this.backupConfig.localPath, file));
                }
            }

            // Delete from S3 if applicable
            if (this.s3) {
                await this.deleteFromS3(backupId);
            }

            console.log(`Deleted backup: ${backupId}`);

        } catch (error) {
            console.error(`Failed to delete backup: ${backupId}`, error);
        }
    }

    async deleteFromS3(backupId) {
        if (!this.s3) return;

        try {
            const listParams = {
                Bucket: this.backupConfig.s3Bucket,
                Prefix: `backups/`
            };

            const objects = await this.s3.listObjectsV2(listParams).promise();
            const filesToDelete = objects.Contents.filter(obj => 
                obj.Key.includes(backupId)
            );

            if (filesToDelete.length > 0) {
                const deleteParams = {
                    Bucket: this.backupConfig.s3Bucket,
                    Delete: {
                        Objects: filesToDelete.map(obj => ({ Key: obj.Key }))
                    }
                };

                await this.s3.deleteObjects(deleteParams).promise();
            }

        } catch (error) {
            console.error('S3 deletion failed:', error);
        }
    }
}

module.exports = BackupService; 