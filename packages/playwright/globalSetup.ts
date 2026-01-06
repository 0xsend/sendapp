import { execSync } from 'node:child_process'

export default async function globalSetup() {
  try {
    // 30 second timeout per check, wait for services to be ready
    execSync('yarn sendctl doctor --timeout=30000 --wait --max-retries=30', {
      stdio: 'inherit',
      env: process.env,
    })
  } catch (error) {
    console.error('Environment health check failed. Aborting tests.')
    process.exit(1)
  }
}
