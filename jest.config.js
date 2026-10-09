module.exports = {
  preset: 'jest-expo',

  testMatch: [
    '<rootDir>/tests/**/*.test.js',
  ],

  moduleNameMapper: {
    '^@/(.*)$':
      '<rootDir>/src/$1',
  },

  collectCoverageFrom: [
    'src/services/conflict.service.ts',
    'src/services/pendingConflict.service.ts',
  ],

  coverageDirectory:
    'coverage-conflict-app',

  coverageReporters: [
    'text',
    'lcov',
  ],

  clearMocks: true,
};