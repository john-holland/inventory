#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Guided Tour Components...\n');

// Check if required files exist
const requiredFiles = [
  'tests/guided-tour.spec.js',
  'run-guided-tour.js',
  'mobile-app/App.tsx',
  'mobile-app/package.json',
  'playwright.config.js',
  'GUIDED-TOUR.md',
  'public/index.html',
  'public/dashboard-modern.html',
  'public/chat.html',
  'public/hr.html',
  'public/calendar.html',
  'public/map.html'
];

console.log('📁 Checking required files...');
let allFilesExist = true;

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - Missing`);
    allFilesExist = false;
  }
});

// Check package.json scripts
console.log('\n📦 Checking package.json scripts...');
const packageJsonPath = path.join(__dirname, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const requiredScripts = ['tour', 'tour:web', 'tour:mobile', 'test:frontend'];
  
  requiredScripts.forEach(script => {
    if (packageJson.scripts && packageJson.scripts[script]) {
      console.log(`✅ ${script} script found`);
    } else {
      console.log(`❌ ${script} script missing`);
      allFilesExist = false;
    }
  });
} else {
  console.log('❌ package.json not found');
  allFilesExist = false;
}

// Check Playwright installation
console.log('\n🎭 Checking Playwright installation...');
const playwrightPath = path.join(__dirname, 'node_modules', '@playwright', 'test');
if (fs.existsSync(playwrightPath)) {
  console.log('✅ Playwright installed');
} else {
  console.log('❌ Playwright not installed - run: npm install');
  allFilesExist = false;
}

// Summary
console.log('\n📊 Test Summary:');
if (allFilesExist) {
  console.log('🎉 All components are ready!');
  console.log('\n🚀 You can now run:');
  console.log('   npm run tour          # Full guided tour');
  console.log('   npm run tour:web      # Web-only tour');
  console.log('   npm run tour:mobile   # Mobile app only');
  console.log('   npm run test:frontend # Frontend testing');
} else {
  console.log('⚠️  Some components are missing. Please check the errors above.');
  console.log('\n💡 To fix:');
  console.log('   1. Run: npm install');
  console.log('   2. Check file paths');
  console.log('   3. Verify package.json scripts');
}

console.log('\n📚 Documentation:');
console.log('   - GUIDED-TOUR.md        # Complete tour documentation');
console.log('   - FRONTEND.md           # Frontend documentation');
console.log('   - README.md             # Main project documentation'); 