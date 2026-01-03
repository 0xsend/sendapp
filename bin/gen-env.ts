#!/usr/bin/env bun run
import { createServer, type AddressInfo } from 'node:net'
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs'
import { join } from 'node:path'
import { parseArgs } from 'node:util'

/**
 * gen-env: Generate a .localnet.env file with dynamically allocated free ports.
 *
 * This enables multiple developers to run independent local development environments
 * simultaneously without port conflicts.
 *
 * Usage:
 *   bun run bin/gen-env.ts                     # Interactive prompt for workspace name
 *   bun run bin/gen-env.ts --name <workspace>  # Generate .localnet.env with free ports
 *   bun run bin/gen-env.ts --force             # Force regenerate even if lockfile exists
 *   bun run bin/gen-env.ts --clean             # Remove .localnet.env and lockfile
 */

// Port configuration structure
interface PortConfig {
  // Next.js
  NEXTJS_PORT: number

  // Supabase
  SUPABASE_API_PORT: number
  SUPABASE_DB_PORT: number
  SUPABASE_STUDIO_PORT: number
  SUPABASE_INBUCKET_PORT: number
  SUPABASE_INBUCKET_SMTP_PORT: number
  SUPABASE_INBUCKET_POP3_PORT: number

  // Anvil (Ethereum nodes)
  ANVIL_MAINNET_PORT: number
  ANVIL_BASE_PORT: number

  // AA Bundler
  BUNDLER_PORT: number

  // Shovel (indexer)
  SHOVEL_PORT: number

  // Otterscan (block explorer)
  OTTERSCAN_MAINNET_PORT: number
  OTTERSCAN_BASE_PORT: number

  // Temporal (workflow engine)
  TEMPORAL_PORT: number
  TEMPORAL_UI_PORT: number

  // Tilt (dev UI)
  TILT_PORT: number
}

// Ordered list of port keys for allocation
const PORT_KEYS: (keyof PortConfig)[] = [
  'NEXTJS_PORT',
  'SUPABASE_API_PORT',
  'SUPABASE_DB_PORT',
  'SUPABASE_STUDIO_PORT',
  'SUPABASE_INBUCKET_PORT',
  'SUPABASE_INBUCKET_SMTP_PORT',
  'SUPABASE_INBUCKET_POP3_PORT',
  'ANVIL_MAINNET_PORT',
  'ANVIL_BASE_PORT',
  'BUNDLER_PORT',
  'SHOVEL_PORT',
  'OTTERSCAN_MAINNET_PORT',
  'OTTERSCAN_BASE_PORT',
  'TEMPORAL_PORT',
  'TEMPORAL_UI_PORT',
  'TILT_PORT',
]

// Lockfile schema includes workspace name for validation
interface LockfileData {
  workspaceName: string
  ports: PortConfig
}

// Workspace name validation pattern (alphanumeric, dashes, underscores)
const WORKSPACE_NAME_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/

function validateWorkspaceName(name: string): void {
  if (!name) {
    throw new Error('Workspace name is required. Use --name <workspace>')
  }
  if (!WORKSPACE_NAME_PATTERN.test(name)) {
    throw new Error(
      `Invalid workspace name "${name}". Must be alphanumeric with optional dashes/underscores, starting with alphanumeric.`
    )
  }
  if (name.length > 63) {
    throw new Error(`Workspace name "${name}" exceeds 63 characters (hostname limit)`)
  }
}

const PROJECT_ROOT = join(import.meta.dir, '..')
const LOCKFILE_PATH = join(PROJECT_ROOT, '.localnet.lock')
const ENV_FILE_PATH = join(PROJECT_ROOT, '.localnet.env')

/**
 * Find a free port by binding to port 0 and getting the OS-assigned port.
 */
async function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.listen(0, '127.0.0.1', () => {
      const address = server.address() as AddressInfo
      const port = address.port
      server.close((err) => {
        if (err) reject(err)
        else resolve(port)
      })
    })
    server.on('error', reject)
  })
}

/**
 * Check if a port is currently in use.
 */
async function isPortInUse(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer()
    server.listen(port, '127.0.0.1', () => {
      server.close(() => resolve(false))
    })
    server.on('error', () => resolve(true))
  })
}

/**
 * Allocate all required ports dynamically.
 */
async function allocatePorts(): Promise<PortConfig> {
  const ports: Partial<PortConfig> = {}
  const usedPorts = new Set<number>()

  for (const key of PORT_KEYS) {
    let port: number
    let attempts = 0
    const maxAttempts = 100

    do {
      port = await findFreePort()
      attempts++
      if (attempts > maxAttempts) {
        throw new Error(`Failed to find free port for ${key} after ${maxAttempts} attempts`)
      }
    } while (usedPorts.has(port))

    usedPorts.add(port)
    ports[key] = port
  }

  return ports as PortConfig
}

/**
 * Validate that all ports in a config are still available.
 */
async function validatePorts(config: PortConfig): Promise<boolean> {
  for (const key of PORT_KEYS) {
    const port = config[key]
    if (await isPortInUse(port)) {
      console.log(`\x1b[33mPort ${port} (${key}) is in use\x1b[0m`)
      return false
    }
  }
  return true
}

/**
 * Load lockfile data if it exists and is valid.
 */
function loadLockfile(): LockfileData | null {
  if (!existsSync(LOCKFILE_PATH)) {
    return null
  }

  try {
    const content = readFileSync(LOCKFILE_PATH, 'utf-8')
    const data = JSON.parse(content) as LockfileData

    // Validate workspace name exists
    if (typeof data.workspaceName !== 'string' || !data.workspaceName) {
      console.log('\x1b[33mLockfile missing workspace name, regenerating...\x1b[0m')
      return null
    }

    // Validate all required port keys exist
    if (!data.ports || typeof data.ports !== 'object') {
      console.log('\x1b[33mLockfile missing ports, regenerating...\x1b[0m')
      return null
    }

    for (const key of PORT_KEYS) {
      if (typeof data.ports[key] !== 'number') {
        console.log(`\x1b[33mLockfile missing or invalid ${key}, regenerating...\x1b[0m`)
        return null
      }
    }

    return data
  } catch {
    console.log('\x1b[33mFailed to parse lockfile, regenerating...\x1b[0m')
    return null
  }
}

/**
 * Save lockfile data.
 */
function saveLockfile(data: LockfileData): void {
  writeFileSync(LOCKFILE_PATH, JSON.stringify(data, null, 2))
}

/**
 * Generate the .localnet.env file content.
 */
function generateEnvContent(workspaceName: string, ports: PortConfig): string {
  const tiltHost = `${workspaceName}.localhost`
  const lines = [
    '# Auto-generated by gen-env. Do not edit manually.',
    `# Generated at: ${new Date().toISOString()}`,
    '#',
    '# These environment variables configure the local development environment',
    '# with dynamically allocated ports to avoid conflicts.',
    '',
    '# Workspace identification',
    `WORKSPACE_NAME=${workspaceName}`,
    `SUPABASE_PROJECT_ID=${workspaceName}`,
    '',
    '# Tilt (dev UI)',
    `TILT_HOST=${tiltHost}`,
    `TILT_PORT=${ports.TILT_PORT}`,
    '',
    '# Next.js',
    `NEXTJS_PORT=${ports.NEXTJS_PORT}`,
    `NEXT_PUBLIC_URL=http://localhost:${ports.NEXTJS_PORT}`,
    '',
    '# Supabase',
    `NEXT_PUBLIC_SUPABASE_URL=http://localhost:${ports.SUPABASE_API_PORT}`,
    `NEXT_PUBLIC_SUPABASE_GRAPHQL_URL=http://localhost:${ports.SUPABASE_API_PORT}/graphql/v1`,
    `SUPABASE_DB_URL=postgresql://postgres:postgres@localhost:${ports.SUPABASE_DB_PORT}/postgres`,
    `SUPABASE_AUTH_SITE_URL=http://localhost:${ports.NEXTJS_PORT}`,
    '',
    '# Supabase ports (for Tilt/config.toml)',
    `SUPABASE_API_PORT=${ports.SUPABASE_API_PORT}`,
    `SUPABASE_DB_PORT=${ports.SUPABASE_DB_PORT}`,
    `SUPABASE_STUDIO_PORT=${ports.SUPABASE_STUDIO_PORT}`,
    `SUPABASE_INBUCKET_PORT=${ports.SUPABASE_INBUCKET_PORT}`,
    `SUPABASE_INBUCKET_SMTP_PORT=${ports.SUPABASE_INBUCKET_SMTP_PORT}`,
    `SUPABASE_INBUCKET_POP3_PORT=${ports.SUPABASE_INBUCKET_POP3_PORT}`,
    '',
    '# Anvil (Ethereum nodes)',
    `NEXT_PUBLIC_MAINNET_RPC_URL=http://localhost:${ports.ANVIL_MAINNET_PORT}`,
    `NEXT_PUBLIC_BASE_RPC_URL=http://localhost:${ports.ANVIL_BASE_PORT}`,
    `ANVIL_MAINNET_PORT=${ports.ANVIL_MAINNET_PORT}`,
    `ANVIL_BASE_PORT=${ports.ANVIL_BASE_PORT}`,
    '',
    '# AA Bundler',
    `NEXT_PUBLIC_BUNDLER_RPC_URL=http://localhost:${ports.BUNDLER_PORT}/rpc`,
    `ERC7677_BUNDLER_RPC_URL=http://localhost:${ports.BUNDLER_PORT}/rpc`,
    `BUNDLER_PORT=${ports.BUNDLER_PORT}`,
    '',
    '# Shovel (indexer)',
    `SHOVEL_PORT=${ports.SHOVEL_PORT}`,
    '',
    '# Otterscan (block explorer)',
    `OTTERSCAN_MAINNET_PORT=${ports.OTTERSCAN_MAINNET_PORT}`,
    `OTTERSCAN_BASE_PORT=${ports.OTTERSCAN_BASE_PORT}`,
    '',
    '# Temporal (workflow engine)',
    `TEMPORAL_ADDR=localhost:${ports.TEMPORAL_PORT}`,
    `TEMPORAL_PORT=${ports.TEMPORAL_PORT}`,
    `TEMPORAL_UI_PORT=${ports.TEMPORAL_UI_PORT}`,
    '',
  ]

  return lines.join('\n')
}

/**
 * Print port summary.
 */
function printSummary(workspaceName: string, ports: PortConfig): void {
  const tiltHost = `${workspaceName}.localhost`
  console.log('')
  console.log('\x1b[36m=== Localnet Port Configuration ===\x1b[0m')
  console.log('')
  console.log(`\x1b[1mWorkspace: ${workspaceName}\x1b[0m`)
  console.log('')
  console.log('\x1b[32mTilt:\x1b[0m')
  console.log(`  Web UI:           http://${tiltHost}:${ports.TILT_PORT}`)
  console.log('')
  console.log('\x1b[32mNext.js:\x1b[0m')
  console.log(`  Web App:          http://localhost:${ports.NEXTJS_PORT}`)
  console.log('')
  console.log('\x1b[32mSupabase:\x1b[0m')
  console.log(`  API:              http://localhost:${ports.SUPABASE_API_PORT}`)
  console.log(`  Studio:           http://localhost:${ports.SUPABASE_STUDIO_PORT}`)
  console.log(`  Database:         postgresql://localhost:${ports.SUPABASE_DB_PORT}`)
  console.log(`  Inbucket:         http://localhost:${ports.SUPABASE_INBUCKET_PORT}`)
  console.log('')
  console.log('\x1b[32mBlockchain:\x1b[0m')
  console.log(`  Anvil Mainnet:    http://localhost:${ports.ANVIL_MAINNET_PORT}`)
  console.log(`  Anvil Base:       http://localhost:${ports.ANVIL_BASE_PORT}`)
  console.log(`  Bundler:          http://localhost:${ports.BUNDLER_PORT}`)
  console.log(`  Otterscan (main): http://localhost:${ports.OTTERSCAN_MAINNET_PORT}`)
  console.log(`  Otterscan (base): http://localhost:${ports.OTTERSCAN_BASE_PORT}`)
  console.log('')
  console.log('\x1b[32mInfrastructure:\x1b[0m')
  console.log(`  Shovel:           http://localhost:${ports.SHOVEL_PORT}`)
  console.log(`  Temporal:         localhost:${ports.TEMPORAL_PORT}`)
  console.log(`  Temporal UI:      http://localhost:${ports.TEMPORAL_UI_PORT}`)
  console.log('')
}

function printUsage(): void {
  console.log('Usage: gen-env [--name <workspace>] [--force] [--clean] [--help]')
  console.log('')
  console.log('Generate .localnet.env with dynamically allocated free ports.')
  console.log('')
  console.log('Options:')
  console.log('  --name <workspace>  Workspace name (e.g., main, feature-x, bb-dev)')
  console.log('                      Used for TILT_HOST (<name>.localhost) and resource prefixes')
  console.log('                      If not provided, prompts interactively')
  console.log('  --force             Force regenerate even if lockfile exists')
  console.log('  --clean             Remove .localnet.env and lockfile')
  console.log('  --help              Show this help message')
}

function promptWorkspaceName(): string {
  const response = prompt('Enter workspace name (e.g., bb-dev): ')
  if (!response || !response.trim()) {
    console.log('\x1b[31mWorkspace name is required\x1b[0m')
    process.exit(1)
  }
  return response.trim()
}

async function main() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      name: { type: 'string', short: 'n' },
      force: { type: 'boolean', short: 'f', default: false },
      clean: { type: 'boolean', short: 'c', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
    allowPositionals: false,
  })

  if (values.help) {
    printUsage()
    process.exit(0)
  }

  if (values.clean) {
    console.log('\x1b[33mCleaning up...\x1b[0m')
    if (existsSync(LOCKFILE_PATH)) {
      unlinkSync(LOCKFILE_PATH)
      console.log(`  Removed ${LOCKFILE_PATH}`)
    }
    if (existsSync(ENV_FILE_PATH)) {
      unlinkSync(ENV_FILE_PATH)
      console.log(`  Removed ${ENV_FILE_PATH}`)
    }
    console.log('\x1b[32mDone!\x1b[0m')
    return
  }

  // Get workspace name from flag or prompt interactively
  const workspaceName = values.name ?? promptWorkspaceName()
  validateWorkspaceName(workspaceName)

  let ports: PortConfig | undefined

  // Try to load existing lockfile
  if (!values.force) {
    const existingData = loadLockfile()
    if (existingData) {
      // Check if workspace name changed
      if (existingData.workspaceName !== workspaceName) {
        console.log(
          `\x1b[33mWorkspace name changed from "${existingData.workspaceName}" to "${workspaceName}", regenerating...\x1b[0m`
        )
      } else {
        console.log('\x1b[34mFound existing port configuration, validating...\x1b[0m')
        const valid = await validatePorts(existingData.ports)
        if (valid) {
          console.log('\x1b[32mExisting ports are available, reusing configuration.\x1b[0m')
          ports = existingData.ports
        } else {
          console.log('\x1b[33mSome ports are in use, allocating new ports...\x1b[0m')
        }
      }
    } else {
      console.log('\x1b[34mAllocating new ports...\x1b[0m')
    }
  } else {
    console.log('\x1b[34mForce regenerating ports...\x1b[0m')
  }

  if (ports === undefined) {
    ports = await allocatePorts()
    saveLockfile({ workspaceName, ports })
  }

  // Generate .localnet.env
  const envContent = generateEnvContent(workspaceName, ports)
  writeFileSync(ENV_FILE_PATH, envContent)
  console.log(`\x1b[32mGenerated ${ENV_FILE_PATH}\x1b[0m`)

  printSummary(workspaceName, ports)

  console.log('\x1b[36mNext steps:\x1b[0m')
  console.log('  1. Reload direnv: direnv allow')
  console.log('  2. Start Tilt:    tilt up')
  console.log('')
  console.log('\x1b[90mTilt reads TILT_HOST and TILT_PORT from .localnet.env automatically\x1b[0m')
}

main().catch((err) => {
  console.error('\x1b[31mError:\x1b[0m', err)
  process.exit(1)
})
