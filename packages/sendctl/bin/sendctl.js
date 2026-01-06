#!/usr/bin/env node

/**
 * CLI binary shim for sendctl
 *
 * This shim uses tsx to run TypeScript directly because @my/wagmi
 * (a workspace dependency) exports TypeScript files. For this reason,
 * sendctl requires tsx to be available.
 *
 * Usage:
 *   node packages/sendctl/bin/sendctl.js --help
 *   ./packages/sendctl/bin/sendctl.js --help
 *   yarn sendctl --help
 */

import { spawn } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const entryPoint = join(__dirname, '..', 'src', 'index.ts')

// Forward all arguments to tsx running the TypeScript entry point
const child = spawn('npx', ['tsx', entryPoint, ...process.argv.slice(2)], {
  stdio: 'inherit',
  env: process.env,
})

child.on('close', (code) => {
  process.exit(code ?? 0)
})
