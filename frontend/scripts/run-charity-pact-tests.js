#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🎭 Running Charity Drop Shipping PACT Tests...\n');

// Configuration
const config = {
  pactDir: './pacts',
  logDir: './logs',
  consumer: 'charity-lending-service',
  provider: 'drop-shipping-api-bridge',
  pactBrokerUrl: process.env.PACT_BROKER_URL || 'http://localhost:9292',
  pactBrokerUsername: process.env.PACT_BROKER_USERNAME || 'test',
  pactBrokerPassword: process.env.PACT_BROKER_PASSWORD || 'test'
};

// Ensure directories exist
[config.pactDir, config.logDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Test scenarios to run
const testScenarios = [
  {
    name: 'Charity Features Enabled',
    description: 'Tests integration when charity features are enabled',
    file: 'charity-drop-shipping.pact.js',
    focus: 'Charity Features Enabled'
  },
  {
    name: 'Charity Features Disabled',
    description: 'Tests integration when charity features are disabled',
    file: 'charity-drop-shipping.pact.js',
    focus: 'Charity Features Disabled'
  },
  {
    name: 'Compliance and Safety',
    description: 'Tests compliance checks and safety measures',
    file: 'charity-drop-shipping.pact.js',
    focus: 'Compliance and Safety Checks'
  },
  {
    name: 'Error Handling',
    description: 'Tests error handling and edge cases',
    file: 'charity-drop-shipping.pact.js',
    focus: 'Error Handling and Edge Cases'
  },
  {
    name: 'Provider Verification',
    description: 'Verifies provider implementation',
    file: 'charity-drop-shipping-provider.pact.js',
    focus: 'Provider Verification'
  },
  {
    name: 'Integration Scenarios',
    description: 'Tests integration scenarios',
    file: 'charity-drop-shipping-provider.pact.js',
    focus: 'Integration Test Scenarios'
  }
];

// Run a single test scenario
async function runTestScenario(scenario) {
  return new Promise((resolve, reject) => {
    console.log(`\n🧪 Running: ${scenario.name}`);
    console.log(`📝 ${scenario.description}`);
    
    const testFile = path.join(__dirname, '..', 'src', 'pacts', scenario.file);
    const logFile = path.join(config.logDir, `${scenario.name.toLowerCase().replace(/\s+/g, '-')}.log`);
    
    // Build Jest command
    const args = [
      '--testPathPattern', testFile,
      '--testNamePattern', scenario.focus,
      '--verbose',
      '--no-coverage',
      '--json',
      '--outputFile', logFile
    ];
    
    if (process.env.CI) {
      args.push('--ci');
    }
    
    const jest = spawn('npx', ['jest', ...args], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, NODE_ENV: 'test' }
    });
    
    let output = '';
    let errorOutput = '';
    
    jest.stdout.on('data', (data) => {
      output += data.toString();
      process.stdout.write(data);
    });
    
    jest.stderr.on('data', (data) => {
      errorOutput += data.toString();
      process.stderr.write(data);
    });
    
    jest.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${scenario.name} - PASSED`);
        resolve({ scenario, success: true, output, errorOutput });
      } else {
        console.log(`❌ ${scenario.name} - FAILED (code: ${code})`);
        resolve({ scenario, success: false, output, errorOutput, code });
      }
    });
    
    jest.on('error', (error) => {
      console.log(`💥 ${scenario.name} - ERROR: ${error.message}`);
      reject({ scenario, error });
    });
  });
}

// Run all test scenarios
async function runAllTests() {
  console.log('🚀 Starting Charity Drop Shipping PACT Test Suite\n');
  
  const results = [];
  const startTime = Date.now();
  
  for (const scenario of testScenarios) {
    try {
      const result = await runTestScenario(scenario);
      results.push(result);
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.log(`💥 Failed to run ${scenario.name}: ${error.message}`);
      results.push({ scenario, success: false, error: error.message });
    }
  }
  
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  
  // Generate summary report
  await generateSummaryReport(results, duration);
  
  // Publish pacts if any were created
  await publishPacts();
  
  return results;
}

// Generate summary report
async function generateSummaryReport(results, duration) {
  console.log('\n📊 Test Summary Report');
  console.log('='.repeat(50));
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const total = results.length;
  
  console.log(`Total Tests: ${total}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ❌`);
  console.log(`Duration: ${duration.toFixed(2)}s`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
  
  if (failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.filter(r => !r.success).forEach(result => {
      console.log(`  - ${result.scenario.name}: ${result.error || 'Test failed'}`);
    });
  }
  
  console.log('\n✅ Passed Tests:');
  results.filter(r => r.success).forEach(result => {
    console.log(`  - ${result.scenario.name}`);
  });
  
  // Save detailed report
  const reportPath = path.join(config.logDir, 'charity-pact-test-report.json');
  const report = {
    timestamp: new Date().toISOString(),
    duration,
    summary: { total, passed, failed, successRate: (passed / total) * 100 },
    results: results.map(r => ({
      scenario: r.scenario.name,
      success: r.success,
      error: r.error,
      code: r.code
    }))
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);
}

// Publish pacts to broker
async function publishPacts() {
  console.log('\n📤 Publishing PACTs to broker...');
  
  return new Promise((resolve) => {
    const pactPublish = spawn('npx', [
      '@pact-foundation/pact-cli',
      'publish',
      config.pactDir,
      '--consumer-app-version', '1.0.0',
      '--broker-base-url', config.pactBrokerUrl,
      '--broker-username', config.pactBrokerUsername,
      '--broker-password', config.pactBrokerPassword
    ], {
      stdio: 'inherit'
    });
    
    pactPublish.on('close', (code) => {
      if (code === 0) {
        console.log('✅ PACTs published successfully');
      } else {
        console.log('⚠️ PACT publishing failed (this is okay in test environment)');
      }
      resolve();
    });
  });
}

// Main execution
async function main() {
  try {
    const results = await runAllTests();
    
    const failedCount = results.filter(r => !r.success).length;
    
    if (failedCount > 0) {
      console.log(`\n💥 ${failedCount} test(s) failed. Check the logs for details.`);
      process.exit(1);
    } else {
      console.log('\n🎉 All Charity Drop Shipping PACT tests passed!');
      console.log('✅ Integration between charity API features and drop shipping API is working correctly.');
      process.exit(0);
    }
  } catch (error) {
    console.error('\n💥 Test suite failed:', error);
    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Charity Drop Shipping PACT Test Runner

Usage:
  node run-charity-pact-tests.js [options]

Options:
  --help, -h          Show this help message
  --scenario <name>   Run only a specific test scenario
  --publish-only      Only publish existing PACTs (skip tests)
  --verbose           Enable verbose output

Environment Variables:
  PACT_BROKER_URL     PACT broker URL (default: http://localhost:9292)
  PACT_BROKER_USERNAME PACT broker username (default: test)
  PACT_BROKER_PASSWORD PACT broker password (default: test)
  CI                  Run in CI mode (default: false)

Test Scenarios:
${testScenarios.map(s => `  - ${s.name}: ${s.description}`).join('\n')}
`);
  process.exit(0);
}

if (process.argv.includes('--publish-only')) {
  publishPacts().then(() => {
    console.log('✅ PACT publishing completed');
    process.exit(0);
  }).catch(error => {
    console.error('❌ PACT publishing failed:', error);
    process.exit(1);
  });
} else {
  main();
} 