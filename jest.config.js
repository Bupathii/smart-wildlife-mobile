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
    'src/services/incident.service.ts',
    'src/services/incident.storage.ts',
    'src/services/incident.sync.ts',
  ],

  coverageDirectory:
    'coverage-conflict-app',

  coverageReporters: [
    'text',
    'lcov',
  ],

  clearMocks: true,
};