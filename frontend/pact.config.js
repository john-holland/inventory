const path = require('path');

module.exports = {
  pactFilesOrFolders: [path.resolve(process.cwd(), 'src/PACT-contracts')],
  pactBroker: process.env.PACT_BROKER_URL || 'http://localhost:9292',
  pactBrokerToken: process.env.PACT_BROKER_TOKEN,
  consumerVersion: process.env.npm_package_version || '1.0.0',
  providerVersion: process.env.PROVIDER_VERSION || '1.0.0',
  publishVerificationResult: process.env.PUBLISH_VERIFICATION_RESULT === 'true',
  tags: process.env.PACT_TAGS ? process.env.PACT_TAGS.split(',') : [],
  
  // Test configuration
  timeout: 30000,
  logLevel: 'info',
  
  // Provider configuration
  provider: {
    name: 'inventory-smart-contract',
    port: 8545,
    host: 'localhost',
    protocol: 'http'
  },
  
  // Consumer configuration
  consumer: {
    name: 'inventory-frontend',
    port: 3000,
    host: 'localhost',
    protocol: 'http'
  },
  
  // Custom middleware for smart contract testing
  customProviderHeaders: {
    'Content-Type': 'application/json'
  },
  
  // State handlers for smart contract testing
  stateHandlers: {
    'Item exists with ID 1': () => {
      // Setup test state for item with ID 1
      return Promise.resolve('Item 1 created');
    },
    'User has sufficient ETH balance': () => {
      // Setup test state for user with sufficient balance
      return Promise.resolve('User balance set');
    },
    'Shipping fund has accumulated value': () => {
      // Setup test state for shipping fund
      return Promise.resolve('Shipping fund initialized');
    }
  },
  
  // Request filters for sensitive data
  requestFilter: (req) => {
    // Remove sensitive data from requests
    if (req.body && req.body.privateKey) {
      delete req.body.privateKey;
    }
    return req;
  },
  
  // Response filters for dynamic data
  responseFilter: (res) => {
    // Replace dynamic values with static ones for testing
    if (res.body && res.body.transactionHash) {
      res.body.transactionHash = '0x1234567890abcdef';
    }
    if (res.body && res.body.timestamp) {
      res.body.timestamp = '1640995200';
    }
    return res;
  }
}; 