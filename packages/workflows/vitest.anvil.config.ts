import { defineConfig } from 'vitest/config'
import { homedir } from 'os'
import { join } from 'path'

// Add foundry bin to PATH if not already present
const foundryBin = join(homedir(), '.foundry', 'bin')
if (!process.env.PATH?.includes(foundryBin)) {
  process.env.PATH = `${foundryBin}:${process.env.PATH}`
}

export default defineConfig({
  test: {
    // Only run anvil integration tests
    include: ['src/**/*.anvil.test.ts'],
    // Longer timeout for fork tests (network latency + anvil startup)
    testTimeout: 120_000,
    hookTimeout: 120_000,
    // Run tests sequentially to avoid port conflicts
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    // Environment variables for fork URL
    env: {
      // Can be overridden via CLI: ANVIL_FORK_URL=... yarn test:anvil
      ANVIL_FORK_URL: process.env.ANVIL_FORK_URL || process.env.ANVIL_BASE_FORK_URL || '',
      // Ensure foundry is in PATH for spawned processes
      PATH: process.env.PATH,
    },
  },
  resolve: {
    alias: {
      // Match tsconfig paths
      '@my/wagmi': new URL('../wagmi/src', import.meta.url).pathname,
      '@my/supabase': new URL('../supabase/src', import.meta.url).pathname,
      app: new URL('../app', import.meta.url).pathname,
    },
  },
})
