import { defineConfig } from 'vitest/config'
import { homedir } from 'node:os'
import { join } from 'node:path'

// Add foundry bin to PATH for Anvil tests
const foundryBin = join(homedir(), '.foundry', 'bin')
if (!process.env.PATH?.includes(foundryBin)) {
  process.env.PATH = `${foundryBin}:${process.env.PATH}`
}

// Common resolve config
const resolveConfig = {
  alias: {
    // Match tsconfig paths
    '@my/wagmi': new URL('../wagmi/src', import.meta.url).pathname,
    '@my/supabase': new URL('../supabase/src', import.meta.url).pathname,
    app: new URL('../app', import.meta.url).pathname,
  },
}

export default defineConfig({
  test: {
    // Use workspace-like project configuration
    include: ['src/**/*.test.ts'],
    // Exclude anvil tests from unit test run - they have network requirements
    exclude: ['src/**/*.anvil.test.ts', '**/node_modules/**'],
    // Environment
    environment: 'node',
    // Setup files - nock disables network for unit tests
    setupFiles: ['./vitest.setup.ts'],
    // Environment variables
    env: {
      TZ: 'UTC',
    },
    // Coverage
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['node_modules/', 'dist/', '*.config.ts', 'vitest.setup.ts', '**/__tests__/**'],
    },
  },
  resolve: resolveConfig,
})
