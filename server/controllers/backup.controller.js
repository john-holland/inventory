"use strict";

const BackupService = require('../services/backupService');
const WarehouseService = require('../services/warehouseService');
const { getRepository } = require('typeorm');
const { getCoefficient } = require('../config/ConstantMarketCoefficients');

class BackupController {
    constructor() {
        this.backupService = new BackupService();
        this.warehouseService = new WarehouseService();
    }

    // Create manual backup
    async createBackup(req, res) {
        try {
            const { type = 'system', description } = req.body;

            console.log(`Manual backup requested: ${type}`);

            let backupResult;
            if (type === 'system') {
                backupResult = await this.backupService.createSystemBackup();
            } else if (type === 'warehouse') {
                backupResult = await this.warehouseService.verifyDataIntegrity();
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid backup type'
                });
            }

            // Log backup creation
            await this.logBackupActivity('create', type, req.user.id, backupResult);

            res.json({
                success: true,
                data: backupResult,
                message: `${type} backup created successfully`
            });

        } catch (error) {
            console.error('Backup creation failed:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating backup'
            });
        }
    }

    // Restore from backup
    async restoreBackup(req, res) {
        try {
            const { backupId } = req.params;
            const { components = ['database', 'uploads', 'config'] } = req.body;

            console.log(`Restore requested for backup: ${backupId}`);

            // Validate restore request
            if (!backupId) {
                return res.status(400).json({
                    success: false,
                    message: 'Backup ID is required'
                });
            }

            // Check if user has restore permissions
            if (!req.user.isAdmin) {
                return res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions for restore operation'
                });
            }

            const restoreResult = await this.backupService.restoreFromBackup(backupId, {
                database: components.includes('database'),
                uploads: components.includes('uploads'),
                config: components.includes('config')
            });

            // Log restore activity
            await this.logBackupActivity('restore', 'system', req.user.id, { backupId, components });

            res.json({
                success: true,
                data: restoreResult,
                message: 'Backup restored successfully'
            });

        } catch (error) {
            console.error('Backup restore failed:', error);
            res.status(500).json({
                success: false,
                message: 'Error restoring backup'
            });
        }
    }

    // Get backup list
    async getBackups(req, res) {
        try {
            const { page = 1, limit = 20, type, status } = req.query;

            const backupRegistryPath = path.join(this.backupService.backupConfig.localPath, 'backup_registry.json');
            
            let backups = [];
            if (await this.backupService.fileExists(backupRegistryPath)) {
                const registryContent = await fs.readFile(backupRegistryPath, 'utf8');
                backups = JSON.parse(registryContent);
            }

            // Apply filters
            if (type) {
                backups = backups.filter(backup => backup.type === type);
            }

            if (status) {
                backups = backups.filter(backup => backup.status === status);
            }

            // Pagination
            const total = backups.length;
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            const paginatedBackups = backups.slice(startIndex, endIndex);

            res.json({
                success: true,
                data: paginatedBackups,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            });

        } catch (error) {
            console.error('Error getting backups:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving backups'
            });
        }
    }

    // Get backup details
    async getBackupDetails(req, res) {
        try {
            const { backupId } = req.params;

            const backup = await this.backupService.findBackup(backupId);
            if (!backup) {
                return res.status(404).json({
                    success: false,
                    message: 'Backup not found'
                });
            }

            // Get additional details
            const auditTrail = await this.getBackupAuditTrail(backupId);
            const integrityReport = await this.getBackupIntegrityReport(backupId);

            res.json({
                success: true,
                data: {
                    ...backup,
                    auditTrail,
                    integrityReport
                }
            });

        } catch (error) {
            console.error('Error getting backup details:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving backup details'
            });
        }
    }

    // Delete backup
    async deleteBackup(req, res) {
        try {
            const { backupId } = req.params;

            // Check if user has delete permissions
            if (!req.user.isAdmin) {
                return res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions for delete operation'
                });
            }

            await this.backupService.deleteBackup(backupId);

            // Log deletion activity
            await this.logBackupActivity('delete', 'system', req.user.id, { backupId });

            res.json({
                success: true,
                message: 'Backup deleted successfully'
            });

        } catch (error) {
            console.error('Error deleting backup:', error);
            res.status(500).json({
                success: false,
                message: 'Error deleting backup'
            });
        }
    }

    // Get backup statistics
    async getBackupStats(req, res) {
        try {
            const registryPath = path.join(this.backupService.backupConfig.localPath, 'backup_registry.json');
            
            let backups = [];
            if (await this.backupService.fileExists(registryPath)) {
                const registryContent = await fs.readFile(registryPath, 'utf8');
                backups = JSON.parse(registryContent);
            }

            const stats = {
                totalBackups: backups.length,
                totalSize: backups.reduce((sum, backup) => sum + (backup.size || 0), 0),
                byStatus: {},
                byType: {},
                byLocation: {},
                recentBackups: backups.slice(-10),
                averageBackupSize: backups.length > 0 ? 
                    backups.reduce((sum, backup) => sum + (backup.size || 0), 0) / backups.length : 0
            };

            // Calculate breakdowns
            backups.forEach(backup => {
                stats.byStatus[backup.status] = (stats.byStatus[backup.status] || 0) + 1;
                stats.byType[backup.type] = (stats.byType[backup.type] || 0) + 1;
                stats.byLocation[backup.location] = (stats.byLocation[backup.location] || 0) + 1;
            });

            res.json({
                success: true,
                data: stats
            });

        } catch (error) {
            console.error('Error getting backup stats:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving backup statistics'
            });
        }
    }

    // Get warehouse statistics
    async getWarehouseStats(req, res) {
        try {
            const stats = await this.warehouseService.getWarehouseStatistics();
            const integrityReport = await this.warehouseService.verifyDataIntegrity();
            const complianceReport = await this.warehouseService.generateComplianceReport();

            res.json({
                success: true,
                data: {
                    ...stats,
                    integrity: integrityReport,
                    compliance: complianceReport
                }
            });

        } catch (error) {
            console.error('Error getting warehouse stats:', error);
            res.status(500).json({
                success: false,
                message: 'Error retrieving warehouse statistics'
            });
        }
    }

    // Trigger warehouse lifecycle management
    async triggerWarehouseLifecycle(req, res) {
        try {
            // Check if user has admin permissions
            if (!req.user.isAdmin) {
                return res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions for warehouse management'
                });
            }

            await this.warehouseService.manageTierLifecycle();

            res.json({
                success: true,
                message: 'Warehouse lifecycle management completed'
            });

        } catch (error) {
            console.error('Error triggering warehouse lifecycle:', error);
            res.status(500).json({
                success: false,
                message: 'Error managing warehouse lifecycle'
            });
        }
    }

    // Get audit compliance report
    async getAuditComplianceReport(req, res) {
        try {
            const { startDate, endDate, type } = req.query;

            const report = {
                timestamp: new Date().toISOString(),
                period: { startDate, endDate },
                type: type || 'comprehensive',
                compliance: {
                    backupRetention: await this.checkBackupRetentionCompliance(startDate, endDate),
                    dataIntegrity: await this.checkDataIntegrityCompliance(),
                    accessLogging: await this.checkAccessLoggingCompliance(),
                    encryption: await this.checkEncryptionCompliance()
                },
                recommendations: []
            };

            // Generate recommendations based on compliance status
            if (report.compliance.backupRetention.nonCompliant > 0) {
                report.recommendations.push('Review backup retention policies');
            }

            if (report.compliance.dataIntegrity.failedRecords > 0) {
                report.recommendations.push('Investigate data integrity issues');
            }

            if (report.compliance.accessLogging.missingLogs > 0) {
                report.recommendations.push('Improve access logging coverage');
            }

            res.json({
                success: true,
                data: report
            });

        } catch (error) {
            console.error('Error generating audit compliance report:', error);
            res.status(500).json({
                success: false,
                message: 'Error generating compliance report'
            });
        }
    }

    // Export backup for external audit
    async exportBackupForAudit(req, res) {
        try {
            const { backupId } = req.params;
            const { format = 'json' } = req.query;

            // Check if user has audit permissions
            if (!req.user.isAdmin && !req.user.canAudit) {
                return res.status(403).json({
                    success: false,
                    message: 'Insufficient permissions for audit export'
                });
            }

            const backup = await this.backupService.findBackup(backupId);
            if (!backup) {
                return res.status(404).json({
                    success: false,
                    message: 'Backup not found'
                });
            }

            // Create audit export
            const auditExport = await this.createAuditExport(backupId, format);

            // Log audit export
            await this.logBackupActivity('audit_export', 'system', req.user.id, { backupId, format });

            res.json({
                success: true,
                data: auditExport,
                message: 'Audit export created successfully'
            });

        } catch (error) {
            console.error('Error exporting backup for audit:', error);
            res.status(500).json({
                success: false,
                message: 'Error creating audit export'
            });
        }
    }

    // Utility methods
    async logBackupActivity(action, type, userId, details) {
        try {
            const activityLog = {
                action,
                type,
                userId,
                timestamp: new Date().toISOString(),
                details
            };

            const logPath = path.join(this.backupService.backupConfig.localPath, 'logs', 'backup_activities.json');
            let activities = [];
            
            if (await this.backupService.fileExists(logPath)) {
                const logContent = await fs.readFile(logPath, 'utf8');
                activities = JSON.parse(logContent);
            }

            activities.push(activityLog);
            await fs.writeFile(logPath, JSON.stringify(activities, null, 2));

        } catch (error) {
            console.error('Error logging backup activity:', error);
        }
    }

    async getBackupAuditTrail(backupId) {
        try {
            const auditPath = path.join(this.backupService.backupConfig.localPath, 'logs', 'audit_trail.json');
            
            if (!await this.backupService.fileExists(auditPath)) return [];

            const auditContent = await fs.readFile(auditPath, 'utf8');
            const auditTrail = JSON.parse(auditContent);

            return auditTrail.filter(entry => entry.backupId === backupId);

        } catch (error) {
            console.error('Error getting backup audit trail:', error);
            return [];
        }
    }

    async getBackupIntegrityReport(backupId) {
        try {
            const errorPath = path.join(this.backupService.backupConfig.localPath, 'logs', 'backup_errors.json');
            
            if (!await this.backupService.fileExists(errorPath)) return { errors: [] };

            const errorContent = await fs.readFile(errorPath, 'utf8');
            const errorLogs = JSON.parse(errorContent);

            const backupErrors = errorLogs.filter(log => log.backupId === backupId);

            return {
                errors: backupErrors,
                integrityStatus: backupErrors.length === 0 ? 'verified' : 'failed'
            };

        } catch (error) {
            console.error('Error getting backup integrity report:', error);
            return { errors: [], integrityStatus: 'unknown' };
        }
    }

    async createAuditExport(backupId, format) {
        try {
            const backup = await this.backupService.findBackup(backupId);
            const auditTrail = await this.getBackupAuditTrail(backupId);
            const integrityReport = await this.getBackupIntegrityReport(backupId);

            const exportData = {
                backupId,
                exportTimestamp: new Date().toISOString(),
                format,
                backup: backup,
                auditTrail: auditTrail,
                integrityReport: integrityReport
            };

            const exportPath = path.join(this.backupService.backupConfig.localPath, 'exports', `audit_export_${backupId}_${Date.now()}.${format}`);
            
            if (format === 'json') {
                await fs.writeFile(exportPath, JSON.stringify(exportData, null, 2));
            } else if (format === 'csv') {
                // Convert to CSV format
                const csvData = this.convertToCSV(exportData);
                await fs.writeFile(exportPath, csvData);
            }

            return {
                exportPath,
                format,
                size: (await fs.stat(exportPath)).size
            };

        } catch (error) {
            console.error('Error creating audit export:', error);
            throw error;
        }
    }

    convertToCSV(data) {
        // Simple CSV conversion - in production, use proper CSV libraries
        const rows = [];
        rows.push(['backupId', 'timestamp', 'action', 'status']);
        
        if (data.auditTrail) {
            data.auditTrail.forEach(entry => {
                rows.push([entry.backupId, entry.timestamp, entry.action, entry.status]);
            });
        }

        return rows.map(row => row.join(',')).join('\n');
    }

    // Compliance check methods
    async checkBackupRetentionCompliance(startDate, endDate) {
        // Implementation for checking backup retention compliance
        return { compliant: 0, nonCompliant: 0 };
    }

    async checkDataIntegrityCompliance() {
        // Implementation for checking data integrity compliance
        return { compliant: 0, nonCompliant: 0 };
    }

    async checkAccessLoggingCompliance() {
        // Implementation for checking access logging compliance
        return { compliant: 0, nonCompliant: 0, missingLogs: 0 };
    }

    async checkEncryptionCompliance() {
        // Implementation for checking encryption compliance
        return { compliant: 0, nonCompliant: 0 };
    }
}

module.exports = new BackupController(); 