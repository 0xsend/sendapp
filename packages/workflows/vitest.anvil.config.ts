import { defineConfig } from 'vitest/config'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { execSync } from 'node:child_process'

// Add foundry bin to PATH for Anvil tests
const foundryBin = join(homedir(), '.foundry', 'bin')
if (!process.env.PATH?.includes(foundryBin)) {
  process.env.PATH = `${foundryBin}:${process.env.PATH}`
}

// Kill any stale Anvil processes before running tests to avoid port conflicts
try {
  execSync('pkill -f "anvil.*fork" 2>/dev/null || true', { stdio: 'ignore' })
} catch {
  // Ignore errors - pkill returns non-zero if no processes found
}

export default defineConfig({
  test: {
    // Only run anvil integration tests
    include: ['src/**/*.anvil.test.ts'],
    // Environment
    environment: 'node',
    // Longer timeout for fork tests (network latency + anvil startup)
    testTimeout: 120_000,
    hookTimeout: 120_000,
    // Run tests sequentially in a single thread to avoid port conflicts
    // Each test spawns its own Anvil instance on a random port via get-port
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    // Limit concurrency to prevent port exhaustion
    maxConcurrency: 1,
    // Isolate tests to prevent shared state issues
    isolate: true,
    // NO setup files - anvil tests need real network access
    setupFiles: [],
    // Environment variables for fork URL
    env: {
      TZ: 'UTC',
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
