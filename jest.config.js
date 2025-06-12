/**
 * For a detailed explanation regarding each configuration property, see:
 * https://jestjs.io/docs/configuration
 */


/** @type {import('jest').Config} */
const config = {
  // A map from regular expressions to module names that allow to stub out resources with a single module
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // The test environment that will be used for testing
  testEnvironment: 'jsdom',

  // A list of paths to modules that run after each test suite is executed
  // setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: ['/node_modules/(?!(lucide-react|@hookform|react-hook-form|@radix-ui)/)'],

  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', { presets: ['next/babel'] }],
  },

};

module.exports = config;