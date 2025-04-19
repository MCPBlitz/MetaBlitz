module.exports = {
  testEnvironment: 'node',
  verbose: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/tests/'
  ],
  coverageReporters: [
    'text',
    'lcov',
    'clover'
  ],
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  bail: 1,
  clearMocks: true,
  testTimeout: 10000,
  setupFilesAfterEnv: ['./tests/setup.js'],
  globalSetup: './tests/globalSetup.js',
  globalTeardown: './tests/globalTeardown.js'
}; 