// Jest setup file for PACT tests
require('@testing-library/jest-dom');

// Mock fetch for PACT tests
global.fetch = jest.fn();

// Mock console methods to reduce noise during tests
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.PACT_LOG_LEVEL = 'ERROR';
process.env.PACT_PORT = '4001';

// Mock PACT broker URL
process.env.PACT_BROKER_URL = 'http://localhost:9292';

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  if (global.fetch.mockClear) {
    global.fetch.mockClear();
  }
});

// Clean up after all tests
afterAll(() => {
  global.console = originalConsole;
});
