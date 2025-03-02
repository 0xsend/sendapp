import { makeConfig } from '@indexsupply/shovel-config'
import type { Source, Integration } from '@indexsupply/shovel-config'
import {
  sendAccountCreatedIntegration,
  sendAccountTransfersIntegration,
  sendAccountReceivesIntegration,
  sendTokenTransfersIntegration,
  sendTokenV0TransfersIntegration,
  sendRevenuesSafeReceives,
  sendAccountSigningKeyAdded,
  sendAccountSigningKeyRemoved,
  sendtagCheckoutReceiptsIntegration,
  sendPotUserTicketPurchaseIntegration,
  sendPotJackpotRunIntegration,
  sendEarnCreate,
  sendEarnNewAffiliate,
} from './integrations'

const baseRpcUrls = {
  chain_id: '$BASE_CHAIN_ID' as const,
  url: '$BASE_RPC_URL_PRIMARY',
  urls: [
    '$BASE_RPC_URL_PRIMARY',
    '$BASE_RPC_URL_BACKUP1',
    '$BASE_RPC_URL_PRIMARY',
    '$BASE_RPC_URL_BACKUP2',
    '$BASE_RPC_URL_PRIMARY',
    '$BASE_RPC_URL_BACKUP3',
  ],
}

// baseSrcBlockHeaders is to be used for integrations that require block headers
const baseSrcBlockHeaders: Source = {
  name: 'base_block_headers',
  batch_size: 100,
  concurrency: 1,
  ...baseRpcUrls,
}

// baseSrcLogs is to be used for integrations that require logs
const baseSrcLogs: Source = {
  name: 'base_logs',
  batch_size: 2000,
  concurrency: 2,
  ...baseRpcUrls,
}

export const sources: Source[] = [baseSrcBlockHeaders, baseSrcLogs]

export const integrations: Integration[] = [
  {
    ...sendAccountCreatedIntegration,
    sources: [{ name: baseSrcLogs.name, start: '$BASE_BLOCK_START' }],
  },
  {
    ...sendAccountTransfersIntegration,
    sources: [{ name: baseSrcLogs.name, start: '$BASE_BLOCK_START' }],
  },
  {
    ...sendTokenTransfersIntegration,
    sources: [{ name: baseSrcLogs.name, start: '$BASE_BLOCK_START' }],
  },
  {
    ...sendTokenV0TransfersIntegration,
    sources: [{ name: baseSrcLogs.name, start: '$BASE_BLOCK_START' }],
  },
  {
    ...sendRevenuesSafeReceives,
    sources: [{ name: baseSrcLogs.name, start: '$BASE_BLOCK_START' }],
  },
  {
    ...sendAccountSigningKeyAdded,
    sources: [{ name: baseSrcLogs.name, start: '$BASE_BLOCK_START' }],
  },
  {
    ...sendAccountSigningKeyRemoved,
    sources: [{ name: baseSrcLogs.name, start: '$BASE_BLOCK_START' }],
  },
  {
    ...sendAccountReceivesIntegration,
    sources: [{ name: baseSrcLogs.name, start: '$BASE_BLOCK_START' }],
  },
  {
    ...sendtagCheckoutReceiptsIntegration,
    sources: [{ name: baseSrcLogs.name, start: '$BASE_BLOCK_START' }],
  },
  {
    ...sendPotUserTicketPurchaseIntegration,
    sources: [{ name: baseSrcLogs.name, start: '$BASE_BLOCK_START' }],
  },
  {
    ...sendPotJackpotRunIntegration,
    sources: [{ name: baseSrcLogs.name, start: '$BASE_BLOCK_START' }],
  },
  {
    ...sendEarnCreate,
    sources: [{ name: baseSrcLogs.name, start: '$BASE_BLOCK_START' }],
  },
  {
    ...sendEarnNewAffiliate,
    sources: [{ name: baseSrcLogs.name, start: '$BASE_BLOCK_START' }],
  },
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
