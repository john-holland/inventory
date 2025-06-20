# Use Node.js 18 Alpine for smaller image size
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    postgresql-client \
    curl \
    bash \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy backup service code
COPY server/services/backupService.js ./server/services/
COPY server/config/ ./server/config/
COPY server/entities/ ./server/entities/

# Create backup service entry point
RUN echo '#!/usr/bin/env node\n\
"use strict";\n\
\n\
const BackupService = require("./server/services/backupService");\n\
const { createConnection } = require("typeorm");\n\
const entities = require("./server/entities");\n\
const express = require("express");\n\
const cron = require("node-cron");\n\
\n\
const app = express();\n\
const PORT = process.env.PORT || 3004;\n\
\n\
async function initializeDatabase() {\n\
    try {\n\
        await createConnection({\n\
            type: "postgres",\n\
            host: process.env.DB_HOST || "localhost",\n\
            port: process.env.DB_PORT || 5432,\n\
            username: process.env.DB_USER || "postgres",\n\
            password: process.env.DB_PASSWORD || "password",\n\
            database: process.env.DB_NAME || "inventory_system",\n\
            entities: entities,\n\
            synchronize: false,\n\
            logging: false\n\
        });\n\
        console.log("Backup database connected");\n\
    } catch (error) {\n\
        console.error("Backup database connection failed:", error);\n\
        process.exit(1);\n\
    }\n\
}\n\
\n\
// Initialize backup service\n\
const backupService = new BackupService();\n\
\n\
// Health check endpoint\n\
app.get("/health", (req, res) => {\n\
    res.json({ status: "healthy", service: "backup" });\n\
});\n\
\n\
// Backup endpoints\n\
app.post("/backup/create", async (req, res) => {\n\
    try {\n\
        const backup = await backupService.createBackup();\n\
        res.json({ success: true, data: backup });\n\
    } catch (error) {\n\
        res.status(500).json({ success: false, message: error.message });\n\
    }\n\
});\n\
\n\
app.get("/backup/list", async (req, res) => {\n\
    try {\n\
        const backups = await backupService.listBackups();\n\
        res.json({ success: true, data: backups });\n\
    } catch (error) {\n\
        res.status(500).json({ success: false, message: error.message });\n\
    }\n\
});\n\
\n\
app.post("/backup/restore/:id", async (req, res) => {\n\
    try {\n\
        const result = await backupService.restoreBackup(req.params.id);\n\
        res.json({ success: true, data: result });\n\
    } catch (error) {\n\
        res.status(500).json({ success: false, message: error.message });\n\
    }\n\
});\n\
\n\
app.get("/backup/audit", async (req, res) => {\n\
    try {\n\
        const audit = await backupService.generateAuditReport();\n\
        res.json({ success: true, data: audit });\n\
    } catch (error) {\n\
        res.status(500).json({ success: false, message: error.message });\n\
    }\n\
});\n\
\n\
// Schedule automated backups\n\
cron.schedule("0 2 * * *", async () => {\n\
    console.log("Running scheduled backup...");\n\
    try {\n\
        await backupService.createBackup();\n\
        console.log("Scheduled backup completed successfully");\n\
    } catch (error) {\n\
        console.error("Scheduled backup failed:", error);\n\
    }\n\
});\n\
\n\
// Schedule backup cleanup\n\
cron.schedule("0 3 * * 0", async () => {\n\
    console.log("Running backup cleanup...");\n\
    try {\n\
        await backupService.cleanupOldBackups();\n\
        console.log("Backup cleanup completed successfully");\n\
    } catch (error) {\n\
        console.error("Backup cleanup failed:", error);\n\
    }\n\
});\n\
\n\
// Start server\n\
async function startServer() {\n\
    try {\n\
        await initializeDatabase();\n\
        \n\
        app.listen(PORT, () => {\n\
            console.log(`💾 Backup service running on port ${PORT}`);\n\
        });\n\
    } catch (error) {\n\
        console.error("Failed to start backup service:", error);\n\
        process.exit(1);\n\
    }\n\
}\n\
\n\
startServer();\n\
' > backup-service.js

# Make the service executable
RUN chmod +x backup-service.js

# Create necessary directories
RUN mkdir -p /app/backups /app/logs

# Set permissions
RUN chown -R node:node /app
USER node

# Expose port
EXPOSE 3004

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3004/health || exit 1

# Start the backup service
CMD ["node", "backup-service.js"] 