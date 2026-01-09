import { execSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const monorepoRoot = path.resolve(__dirname, '..', '..')

export default async function globalSetup() {
  try {
    // 30 second timeout per check, wait for services to be ready
    // Run from monorepo root so yarn can find the sendctl script
    execSync('yarn sendctl doctor --timeout=30000 --wait --max-retries=30', {
      stdio: 'inherit',
      env: process.env,
      cwd: monorepoRoot,
    })
  } catch (error) {
    console.error('Environment health check failed. Aborting tests.')
    process.exit(1)
  }
}
