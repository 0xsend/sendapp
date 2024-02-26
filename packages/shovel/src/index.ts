import { makeConfig } from '@indexsupply/shovel-config'
import type { Source, Integration } from '@indexsupply/shovel-config'
import {
  sendAccountDeployedIntegration,
  sendAccountTransfersIntegration,
  // sendAccountTransactionsIntegration,
  sendTokenTransfersIntegration,
} from './integrations'

// baseSrcBlockHeaders is to be used for integrations that require block headers
const baseSrcBlockHeaders: Source = {
  name: '$BASE_NAME',
  url: '$BASE_RPC_URL',
  chain_id: '$BASE_CHAIN_ID',
  batch_size: 100,
  concurrency: 1,
}

// baseSrcLogs is to be used for integrations that require logs
const baseSrcLogs: Source = {
  name: '$BASE_NAME',
  url: '$BASE_RPC_URL',
  chain_id: '$BASE_CHAIN_ID',
  batch_size: 2000,
  concurrency: 2,
}

export const sources: Source[] = [baseSrcBlockHeaders, baseSrcLogs]

export const integrations: Integration[] = [
  {
    ...sendAccountDeployedIntegration,
    // @ts-expect-error start is bigint but we will load it from env
    sources: [{ name: baseSrcLogs.name, start: '$BASE_BLOCK_START' }],
  },
  {
    ...sendAccountTransfersIntegration,
    // @ts-expect-error start is bigint but we will load it from env
    sources: [{ name: baseSrcLogs.name, start: '$BASE_BLOCK_START' }],
  },
  {
    ...sendTokenTransfersIntegration,
    // start is block of first transfer on base
    sources: [{ name: baseSrcLogs.name, start: 9475780n }],
  },
  // @todo split this into two integrations, one for Receive and one for UserOperationEvent
  // {
  //   ...sendAccountTransactionsIntegration,
  //   // @ts-expect-error start is bigint but we will load it from env
  //   sources: [{ name: baseSrcBlockHeaders.name, start: '$BASE_BLOCK_START' }],
  // },
]

const c = makeConfig({
  pg_url: '$DATABASE_URL',
  sources,
  integrations,
  dashboard: {
    root_password: '$DASHBOARD_ROOT_PASSWORD',
  },
})

export const config = c
