#!/usr/bin/env node

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}`;

const pages = [
    { path: '/', name: 'Home Page' },
    { path: '/dashboard', name: 'Modern Dashboard' },
    { path: '/dashboard-old', name: 'Old Dashboard' },
    { path: '/chat', name: 'Chat System' },
    { path: '/hr', name: 'HR Dashboard' },
    { path: '/calendar', name: 'Calendar System' },
    { path: '/map', name: 'Map Interface' },
    { path: '/health', name: 'Health Check' }
];

const publicFiles = [
    'index.html',
    'dashboard-modern.html',
    'dashboard.html',
    'chat.html',
    'hr.html',
    'calendar.html',
    'map.html'
];

console.log('🚀 Testing Distributed Inventory System Frontend\n');

// Test if public files exist
console.log('📁 Checking public files...');
publicFiles.forEach(file => {
    const filePath = path.join(__dirname, 'public', file);
    if (fs.existsSync(filePath)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - Missing`);
    }
});

console.log('\n🌐 Testing web pages...');

// Test each page
async function testPage(page) {
    return new Promise((resolve) => {
        const req = http.get(`${BASE_URL}${page.path}`, (res) => {
            if (res.statusCode === 200) {
                console.log(`✅ ${page.name} - ${res.statusCode}`);
                resolve(true);
            } else {
                console.log(`❌ ${page.name} - ${res.statusCode}`);
                resolve(false);
            }
        });
        
        req.on('error', (err) => {
            console.log(`❌ ${page.name} - Connection failed: ${err.message}`);
            resolve(false);
        });
        
        req.setTimeout(5000, () => {
            console.log(`❌ ${page.name} - Timeout`);
            req.destroy();
            resolve(false);
        });
    });
}

async function runTests() {
    let passed = 0;
    let total = pages.length;
    
    for (const page of pages) {
        const success = await testPage(page);
        if (success) passed++;
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay between requests
    }
    
    console.log(`\n📊 Test Results: ${passed}/${total} pages accessible`);
    
    if (passed === total) {
        console.log('🎉 All tests passed! Frontend is ready.');
    } else {
        console.log('⚠️  Some tests failed. Check server status.');
    }
    
    console.log('\n🔗 Quick Links:');
    pages.forEach(page => {
        console.log(`   ${page.name}: ${BASE_URL}${page.path}`);
    });
}

// Check if server is running first
const healthCheck = http.get(`${BASE_URL}/health`, (res) => {
    if (res.statusCode === 200) {
        console.log('✅ Server is running\n');
        runTests();
    } else {
        console.log('❌ Server health check failed');
        console.log('💡 Make sure to start the server first: npm start');
    }
});

healthCheck.on('error', (err) => {
    console.log('❌ Cannot connect to server');
    console.log('💡 Make sure to start the server first: npm start');
    console.log(`   Expected server at: ${BASE_URL}`);
}); 