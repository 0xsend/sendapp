/**
 * For a detailed explanation regarding each configuration property, visit:
 * https://jestjs.io/docs/configuration
 */

import type { Config } from 'jest'

const config: Config = {
  projects: ['<rootDir>/packages/app', '<rootDir>/packages/workflows', '<rootDir>/apps/next'],
}

export default config
