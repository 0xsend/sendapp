/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

import type { Config } from 'jest'

const config: Config = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  clearMocks: true,
  collectCoverage: false,
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['/node_modules/'],
  workerThreads: true,
  globalSetup: '<rootDir>/jest.setup.ts',
  extensionsToTreatAsEsm: ['.ts'],
  transformIgnorePatterns: ['node_modules/(?!(viem|@snaplet))'],
  moduleNameMapper: {
    // Keep the existing ESM .js mapping
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.[tj]sx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          module: 'esnext',
        },
      },
    ],
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup-after-env.ts'],
  verbose: true,
  // Test timeout for database operations
  testTimeout: 30000,
}

export default config
