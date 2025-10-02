#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const config = {
  testFile: 'src/pacts/cabin-airbnb-provider.pact.js',
  logDir: 'logs',
  pactDir: 'pacts',
  port: 4001
};

// Ensure directories exist
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Run PACT tests
const runPactTests = () => {
  console.log('🏠 Starting Cabin AirBnB PACT Tests...\n');

  // Ensure directories exist
  ensureDir(config.logDir);
  ensureDir(config.pactDir);

  // Set environment variables
  const env = {
    ...process.env,
    NODE_ENV: 'test',
    PACT_LOG_LEVEL: 'INFO',
    PACT_PORT: config.port.toString()
  };

  // Run Jest with PACT tests
  const jestProcess = spawn('npx', [
    'jest',
    config.testFile,
    '--verbose',
    '--detectOpenHandles',
    '--forceExit',
    '--testTimeout=30000'
  ], {
    env,
    stdio: 'inherit',
    cwd: process.cwd()
  });

  jestProcess.on('close', (code) => {
    if (code === 0) {
      console.log('\n✅ Cabin PACT tests completed successfully!');
      console.log(`📄 PACT files generated in: ${config.pactDir}`);
      console.log(`📝 Logs available in: ${config.logDir}`);
      
      // List generated PACT files
      const pactFiles = fs.readdirSync(config.pactDir)
        .filter(file => file.endsWith('.json'))
        .filter(file => file.includes('cabin') || file.includes('airbnb'));
      
      if (pactFiles.length > 0) {
        console.log('\n📋 Generated PACT files:');
        pactFiles.forEach(file => {
          console.log(`  - ${file}`);
        });
      }
    } else {
      console.log(`\n❌ Cabin PACT tests failed with exit code: ${code}`);
      process.exit(code);
    }
  });

  jestProcess.on('error', (error) => {
    console.error('❌ Error running PACT tests:', error);
    process.exit(1);
  });
};

// Publish PACT files to broker
const publishPacts = () => {
  console.log('📤 Publishing Cabin PACT files to broker...\n');

  const publishProcess = spawn('npx', [
    'pact-broker',
    'publish',
    config.pactDir,
    '--consumer-app-version',
    process.env.npm_package_version || '1.0.0',
    '--broker-base-url',
    process.env.PACT_BROKER_URL || 'http://localhost:9292',
    '--broker-token',
    process.env.PACT_BROKER_TOKEN || '',
    '--verbose'
  ], {
    stdio: 'inherit',
    cwd: process.cwd()
  });

  publishProcess.on('close', (code) => {
    if (code === 0) {
      console.log('\n✅ PACT files published successfully!');
    } else {
      console.log(`\n❌ Failed to publish PACT files with exit code: ${code}`);
      process.exit(code);
    }
  });
};

// Main execution
const main = () => {
  const args = process.argv.slice(2);
  
  if (args.includes('--publish')) {
    publishPacts();
  } else if (args.includes('--publish-only')) {
    publishPacts();
  } else {
    runPactTests();
  }
};

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Cabin PACT tests interrupted');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Cabin PACT tests terminated');
  process.exit(0);
});

// Run main function
main();

