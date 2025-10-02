module.exports = {
  testEnvironment: 'node',
  testMatch: [
    '**/src/pacts/**/*.pact.js',
    '**/src/**/*.test.js',
    '**/src/**/*.spec.js'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/pacts/**/*.pact.js',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/*.spec.{js,jsx,ts,tsx}'
  ],
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  testTimeout: 30000,
  verbose: true,
  detectOpenHandles: true,
  forceExit: true,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest'
  },
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
  globals: {
    'process.env.NODE_ENV': 'test'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(.*\\.mjs$|@pact-foundation))'
  ]
};
