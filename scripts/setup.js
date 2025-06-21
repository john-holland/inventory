#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Distributed Inventory System - Setup\n');

// Check if .env exists
const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', 'env.example');

if (!fs.existsSync(envPath)) {
    console.log('📝 Creating .env file from template...');
    
    if (fs.existsSync(envExamplePath)) {
        fs.copyFileSync(envExamplePath, envPath);
        console.log('✅ .env file created');
    } else {
        console.log('❌ env.example not found');
        process.exit(1);
    }
} else {
    console.log('✅ .env file already exists');
}

// Create directories if they don't exist
const directories = [
    'public/uploads',
    'public/images',
    'logs',
    'backups'
];

directories.forEach(dir => {
    const dirPath = path.join(__dirname, '..', dir);
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
    }
});

console.log('\n🔧 Configuration Required:');
console.log('\n1. eBay API Configuration:');
console.log('   EBAY_APP_ID=your_app_id');
console.log('   EBAY_CERT_ID=your_cert_id');
console.log('   EBAY_CLIENT_SECRET=your_client_secret');
console.log('   EBAY_DEV_ID=your_dev_id');
console.log('   EBAY_SANDBOX=true');
console.log('   EBAY_MARKETPLACE=EBAY-US');

console.log('\n2. Google Calendar API:');
console.log('   GOOGLE_CLIENT_ID=your_client_id');
console.log('   GOOGLE_CLIENT_SECRET=your_client_secret');
console.log('   GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback');

console.log('\n3. Email Configuration:');
console.log('   SMTP_HOST=smtp.gmail.com');
console.log('   SMTP_PORT=587');
console.log('   SMTP_USER=your_email@gmail.com');
console.log('   SMTP_PASS=your_app_password');

console.log('\n4. Database Configuration:');
console.log('   DATABASE_URL=postgresql://user:password@localhost:5432/inventory');
console.log('   REDIS_URL=redis://localhost:6379');

console.log('\n📋 Next Steps:');
console.log('   1. Edit .env file with your configuration');
console.log('   2. Run: npm run migrate');
console.log('   3. Run: npm run dev');
console.log('   4. Test: node test-new-features.js');

console.log('\n🎯 Features Ready:');
console.log('   ✅ Map Interface with Eyelash Routes');
console.log('   ✅ eBay Integration (needs API keys)');
console.log('   ✅ Chat System (entities created)');
console.log('   ✅ HR System (entities created)');
console.log('   ✅ Calendar System (entities created)');

console.log('\n✨ Setup complete!'); 