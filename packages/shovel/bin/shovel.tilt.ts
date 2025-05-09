#!/usr/bin/env zx

import 'zx/globals'

// Set verbosity based on SHOVEL_QUIET env var. If SHOVEL_QUIET=1, verbose is false.
$.verbose = !process.env.SHOVEL_QUIET

$.env.SHOVEL_VERSION ||= 'af07'

/**
 * This script is used to start the shovel container for local development.
 * It is not intended to be used in production.
 *
 * SHOVEL_DEBUG=1 - Enables debug mode, which prints verbose logs to the console.
 * SHOVEL_MIGRATE=1 - Enables migration mode, which tells shovel to create the database and run migrations. Useful for adding new integrations.
 */

await $`docker ps -a | grep shovel | awk '{{print $1}}' | xargs -r docker rm -f || true`

const blockNumberProc =
  await $`cast rpc --rpc-url http://127.0.0.1:8546 eth_blockNumber | jq -r . | cast to-dec`
const blockNumber = blockNumberProc.stdout.trim()

const chainIdProc = await $`cast chain-id --rpc-url http://127.0.0.1:8546`
const chainId = chainIdProc.stdout.trim()

if (!$.env.SHOVEL_SKIP_EMPTY) {
  await import('./empty-shovel.dev.ts')
}

const dockerArgs = [
  'run',
  '--rm',
  '--name',
  'shovel',
  '--add-host=host.docker.internal:host-gateway',
  '-p',
  '8383:80',
  '--memory=300m',
  '--cpus=1',
  '--env',
  'DATABASE_URL=postgresql://postgres:postgres@host.docker.internal:54322/postgres',
  '--env',
  'BASE_NAME=base',
  '--env',
  'BASE_RPC_URL_PRIMARY=http://host.docker.internal:8546',
  '--env',
  'BASE_RPC_URL_BACKUP1=http://host.docker.internal:8546',
  '--env',
  'BASE_RPC_URL_BACKUP2=http://host.docker.internal:8546',
  '--env',
  'BASE_RPC_URL_BACKUP3=http://host.docker.internal:8546',
  '--env',
  `BASE_CHAIN_ID=${chainId}`,
  '--env',
  `BASE_BLOCK_START=${blockNumber}`,
  '--env',
  'DASHBOARD_ROOT_PASSWORD=shoveladmin',
  '-v',
  `${import.meta.dir}/../etc:/etc/shovel`,
  '--entrypoint',
  '/usr/local/bin/shovel',
  '-w',
  '/usr/local/bin',
  `docker.io/indexsupply/shovel:${$.env.SHOVEL_VERSION}`,
  '-l',
  ':80',
  $.env.SHOVEL_DEBUG === '1' ? '-v' : '',
  $.env.SHOVEL_MIGRATE === '1' ? '' : '-skip-migrate',
  '-config',
  '/etc/shovel/config.json',
].filter(Boolean)

if (process.env.SHOVEL_QUIET === '1') {
  // Execute quietly, redirecting stdout and stderr to /dev/null
  // We need to escape the arguments properly for the shell command
  const commandString = ['docker', ...dockerArgs].map((arg) => `'${arg}'`).join(' ')
  await $`sh -c ${`${commandString} > /dev/null 2>&1`}`
} else {
  // Execute normally, allowing output to be displayed
  await $`docker ${dockerArgs}`
}
