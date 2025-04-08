/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

import type { Config } from 'jest'
import { pathsToModuleNameMapper } from 'ts-jest' // Import the utility
// Import compilerOptions from this package's tsconfig
import { compilerOptions } from './tsconfig.json'

const config: Config = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: ['/node_modules/'],
  coverageProvider: 'babel',
  workerThreads: true,
  globalSetup: '<rootDir>/jest.setup.ts',
  transformIgnorePatterns: ['node_modules/(?!(get-port))'],
  moduleNameMapper: {
    // Keep the existing ESM .js mapping
    '^(\\.{1,2}/.*)\\.js$': '$1',

    // Generate mappings from this package's tsconfig.json paths
    // Prefix is relative to <rootDir> (packages/workflows)
    ...pathsToModuleNameMapper(compilerOptions.paths, { prefix: '<rootDir>/' }),
  },
  transform: {
    // '^.+\\.[tj]sx?$' to process ts,js,tsx,jsx with `ts-jest`
    // '^.+\\.m?[tj]sx?$' to process ts,js,tsx,jsx,mts,mjs,mtsx,mjsx with `ts-jest`
    '^.+\\.[tj]sx?$': [
      'ts-jest',
      {
        useESM: true,
        // ts-jest should automatically find the tsconfig, but specify if needed:
        // tsconfig: '<rootDir>/tsconfig.json'
      },
    ],
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup-after-env.ts'],
  setupFiles: ['<rootDir>/jest.setup.ts'],
}

export default config
