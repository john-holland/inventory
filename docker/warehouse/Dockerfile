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

# Copy warehouse service code
COPY server/services/warehouseService.js ./server/services/
COPY server/config/ ./server/config/
COPY server/entities/ ./server/entities/

# Create warehouse service entry point
RUN echo '#!/usr/bin/env node\n\
"use strict";\n\
\n\
const WarehouseService = require("./server/services/warehouseService");\n\
const { createConnection } = require("typeorm");\n\
const entities = require("./server/entities");\n\
const express = require("express");\n\
\n\
const app = express();\n\
const PORT = process.env.PORT || 3002;\n\
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
        console.log("Warehouse database connected");\n\
    } catch (error) {\n\
        console.error("Warehouse database connection failed:", error);\n\
        process.exit(1);\n\
    }\n\
}\n\
\n\
// Initialize warehouse service\n\
const warehouseService = new WarehouseService();\n\
\n\
// Health check endpoint\n\
app.get("/health", (req, res) => {\n\
    res.json({ status: "healthy", service: "warehouse" });\n\
});\n\
\n\
// Warehouse management endpoints\n\
app.post("/warehouse/lifecycle", async (req, res) => {\n\
    try {\n\
        await warehouseService.manageTierLifecycle();\n\
        res.json({ success: true, message: "Lifecycle management completed" });\n\
    } catch (error) {\n\
        res.status(500).json({ success: false, message: error.message });\n\
    }\n\
});\n\
\n\
app.get("/warehouse/stats", async (req, res) => {\n\
    try {\n\
        const stats = await warehouseService.getWarehouseStatistics();\n\
        res.json({ success: true, data: stats });\n\
    } catch (error) {\n\
        res.status(500).json({ success: false, message: error.message });\n\
    }\n\
});\n\
\n\
app.post("/warehouse/verify", async (req, res) => {\n\
    try {\n\
        const report = await warehouseService.verifyDataIntegrity();\n\
        res.json({ success: true, data: report });\n\
    } catch (error) {\n\
        res.status(500).json({ success: false, message: error.message });\n\
    }\n\
});\n\
\n\
// Start server\n\
async function startServer() {\n\
    try {\n\
        await initializeDatabase();\n\
        \n\
        app.listen(PORT, () => {\n\
            console.log(`🏭 Warehouse service running on port ${PORT}`);\n\
        });\n\
    } catch (error) {\n\
        console.error("Failed to start warehouse service:", error);\n\
        process.exit(1);\n\
    }\n\
}\n\
\n\
startServer();\n\
' > warehouse-service.js

# Make the service executable
RUN chmod +x warehouse-service.js

# Create necessary directories
RUN mkdir -p /app/warehouse /app/logs

# Set permissions
RUN chown -R node:node /app
USER node

# Expose port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3002/health || exit 1

# Start the warehouse service
CMD ["node", "warehouse-service.js"] 