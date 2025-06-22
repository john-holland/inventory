"use strict";

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');

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

// Health check
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        version: '3.0.0',
        message: 'Distributed Inventory System - Guided Tour Mode'
    });
});

// API routes for demo
app.get('/api/stats', (req, res) => {
    res.json({
        activeHolds: Math.floor(Math.random() * 50) + 10,
        totalRevenue: (Math.random() * 10000).toFixed(2),
        investmentRobots: Math.floor(Math.random() * 20) + 5,
        waterLevel: Math.floor(Math.random() * 100)
    });
});

app.get('/api/user', (req, res) => {
    res.json({
        id: '1',
        username: 'demo_user',
        email: 'demo@example.com',
        role: 'COMPANY_EMPLOYEE',
        banLevel: 'none',
        wallet: 1250.50
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ 
        success: false, 
        message: 'Route not found' 
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Distributed Inventory System (Tour Mode) running on port ${PORT}`);
    console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
    console.log(`💬 Chat: http://localhost:${PORT}/chat`);
    console.log(`👥 HR: http://localhost:${PORT}/hr`);
    console.log(`📅 Calendar: http://localhost:${PORT}/calendar`);
    console.log(`🗺️  Map: http://localhost:${PORT}/map`);
    console.log(`🔧 API: http://localhost:${PORT}/api`);
    console.log(`💚 Health Check: http://localhost:${PORT}/health`);
});

module.exports = app;
