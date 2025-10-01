import { createClient } from '@supabase/supabase-js'
import { createPublicClient, http, type Address, type Hex } from 'viem'
import { base } from 'viem/chains'
import pino from 'pino'
import { ReconciliationWorker } from './reconciliation-worker.js'

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
    },
  },
})

// Environment validation
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'RECONCILIATION_RPC_URL',
] as const

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    logger.error(`Missing required environment variable: ${envVar}`)
    process.exit(1)
  }
}

// Configuration
const config = {
  batchSize: Number.parseInt(process.env.RECONCILIATION_BATCH_SIZE || '100'),
  rateLimitMs: Number.parseInt(process.env.RECONCILIATION_RATE_LIMIT_MS || '100'),
  pollIntervalMs: Number.parseInt(process.env.RECONCILIATION_POLL_INTERVAL_MS || '60000'),
  chainId: Number.parseInt(process.env.RECONCILIATION_CHAIN_ID || '8453'), // Base mainnet
}

logger.info({ config }, 'Starting balance reconciliation worker')

// Initialize clients
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
)

const publicClient = createPublicClient({
  chain: base,
  transport: http(process.env.RECONCILIATION_RPC_URL),
})

// Create and start worker
const worker = new ReconciliationWorker({
  supabase,
  publicClient,
  logger,
  config,
})

// Graceful shutdown
const shutdown = async (signal: string) => {
  logger.info({ signal }, 'Received shutdown signal')
  await worker.stop()
  process.exit(0)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

// Start the worker
worker.start().catch((error) => {
  logger.error({ error }, 'Worker failed to start')
  process.exit(1)
})
