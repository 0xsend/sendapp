#!/usr/bin/env zx

import 'zx/globals'

await $`docker ps -a | grep shovel | awk '{{print $1}}' | xargs docker rm -f || true`

await $`docker pull docker.io/indexsupply/shovel:latest || true`

const blockNumber =
  await $`cast rpc --rpc-url http://127.0.0.1:8546 eth_blockNumber | jq -r . | cast to-dec`
const chainId = await $`cast chain-id --rpc-url http://127.0.0.1:8546`

await $`docker run --rm \
    --name shovel \
    --add-host=host.docker.internal:host-gateway \
    -p 8383:80 \
    --env DATABASE_URL=postgresql://postgres:postgres@host.docker.internal:54322/postgres \
    --env BASE_NAME=base \
    --env BASE_RPC_URL=http://host.docker.internal:8546 \
    --env BASE_CHAIN_ID=${chainId} \
    --env BASE_BLOCK_START="${blockNumber}" \
    --env DASHBOARD_ROOT_PASSWORD=shoveladmin \
    -v ${import.meta.dir}/../etc:/etc/shovel \
    --entrypoint /usr/local/bin/shovel \
    -w /usr/local/bin \
    docker.io/indexsupply/shovel -l :80 -config /etc/shovel/config.json`
