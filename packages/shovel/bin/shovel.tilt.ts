#!/usr/bin/env zx

import 'zx/globals'

$.verbose = true

/**
 * This script is used to start the shovel container for local development.
 * It is not intended to be used in production.
 *
 * SHOVEL_DEBUG=1 - Enables debug mode, which prints verbose logs to the console.
 * SHOVEL_MIGRATE=1 - Enables migration mode, which tells shovel to create the database and run migrations. Useful for adding new integrations.
 */

await $`docker ps -a | grep shovel | awk '{{print $1}}' | xargs -r docker rm -f || true`

await $`docker pull docker.io/indexsupply/shovel:3410 || true`

const SENDPOT_BLOCK_START = 27948000
const blockNumber =
  await $`cast rpc --rpc-url http://127.0.0.1:8546 eth_blockNumber | jq -r . | cast to-dec`
const chainId = await $`cast chain-id --rpc-url http://127.0.0.1:8546`

await import('./empty-shovel.dev.ts')

await $`docker run --rm \
    --name shovel \
    --add-host=host.docker.internal:host-gateway \
    -p 8383:80 \
    --env DATABASE_URL=postgresql://postgres:postgres@host.docker.internal:54322/postgres \
    --env BASE_NAME=base \
    --env BASE_RPC_URL=http://host.docker.internal:8546 \
    --env BASE_CHAIN_ID=${chainId} \
    --env BASE_BLOCK_START="${blockNumber}" \
    --env SENDPOT_BLOCK_START="${SENDPOT_BLOCK_START}" \
    --env DASHBOARD_ROOT_PASSWORD=shoveladmin \
    -v ${import.meta.dir}/../etc:/etc/shovel \
    --entrypoint /usr/local/bin/shovel \
    -w /usr/local/bin \
    docker.io/indexsupply/shovel:3410 \
      -l :80 \
      ${$.env.SHOVEL_DEBUG === '1' ? '-v' : ''} \
      ${$.env.SHOVEL_MIGRATE === '1' ? '' : '-skip-migrate'} \
      -config /etc/shovel/config.json`
