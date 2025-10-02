#!/usr/bin/env node

const { Verifier } = require('@pact-foundation/pact');
const path = require('path');
const config = require('../pact.config');

async function runPactTests() {
  console.log('🚀 Starting PACT contract verification...');
  
  const opts = {
    provider: config.provider.name,
    providerBaseUrl: `${config.provider.protocol}://${config.provider.host}:${config.provider.port}`,
    pactBrokerUrl: config.pactBroker,
    pactBrokerToken: config.pactBrokerToken,
    publishVerificationResult: config.publishVerificationResult,
    providerVersion: config.providerVersion,
    consumerVersionSelectors: [
      {
        consumer: config.consumer.name,
        latest: true
      }
    ],
    stateHandlers: config.stateHandlers,
    requestFilter: config.requestFilter,
    responseFilter: config.responseFilter,
    timeout: config.timeout,
    logLevel: config.logLevel
  };

  try {
    const result = await new Verifier(opts).verifyProvider();
    console.log('✅ PACT verification completed successfully!');
    console.log('📊 Results:', result);
    process.exit(0);
  } catch (error) {
    console.error('❌ PACT verification failed:', error);
    process.exit(1);
  }
}

// Run specific PACT tests
async function runSpecificPactTest(testName) {
  console.log(`🧪 Running specific PACT test: ${testName}`);
  
  const testConfig = {
    ...config,
    pactFilesOrFolders: [path.resolve(process.cwd(), `src/PACT-contracts/${testName}.pact`)]
  };
  
  const opts = {
    provider: testConfig.provider.name,
    providerBaseUrl: `${testConfig.provider.protocol}://${testConfig.provider.host}:${testConfig.provider.port}`,
    pactFilesOrFolders: testConfig.pactFilesOrFolders,
    stateHandlers: testConfig.stateHandlers,
    requestFilter: testConfig.requestFilter,
    responseFilter: testConfig.responseFilter,
    timeout: testConfig.timeout,
    logLevel: testConfig.logLevel
  };

  try {
    const result = await new Verifier(opts).verifyProvider();
    console.log(`✅ ${testName} PACT test passed!`);
    return result;
  } catch (error) {
    console.error(`❌ ${testName} PACT test failed:`, error);
    throw error;
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    runPactTests();
  } else if (args[0] === '--test') {
    const testName = args[1];
    if (!testName) {
      console.error('Please specify a test name: npm run pact:test -- --test <test-name>');
      process.exit(1);
    }
    runSpecificPactTest(testName);
  } else if (args[0] === '--smart-contracts') {
    console.log('🔗 Running smart contract PACT tests...');
    runSpecificPactTest('inventory-contract');
  } else if (args[0] === '--crypto') {
    console.log('💰 Running crypto investment PACT tests...');
    runSpecificPactTest('crypto-investment');
  } else {
    console.log('Usage:');
    console.log('  npm run pact:verify                    # Run all PACT tests');
    console.log('  npm run pact:test -- --smart-contracts # Run smart contract tests');
    console.log('  npm run pact:test -- --crypto          # Run crypto investment tests');
    console.log('  npm run pact:test -- --test <name>     # Run specific test');
  }
}

module.exports = {
  runPactTests,
  runSpecificPactTest
}; 