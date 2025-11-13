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
  sendEarnDeposit,
  sendEarnWithdraw,
} from './integrations'
import { createBackfillIntegration, backfills } from './backfills/backfill'

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

// baseSrcBlockHeaders is available but currently unused
// Removed from sources array 2025-10-07: No integrations use block headers
// To re-enable: add back to sources array and update integration sources
// const baseSrcBlockHeaders: Source = {
//   name: 'base_block_headers',
//   batch_size: 100,
//   concurrency: 1,
//   ...baseRpcUrls,
// }

// baseSrcLogs is to be used for integrations that require logs
const baseSrcLogs: Source = {
  name: 'base_logs',
  batch_size: 10,
  concurrency: 8,
  ...baseRpcUrls,
}

export const sources: Source[] = [baseSrcLogs]

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
  {
    ...sendEarnDeposit,
    sources: [{ name: baseSrcLogs.name, start: '$BASE_BLOCK_START' }],
  },
  {
    ...sendEarnWithdraw,
    sources: [{ name: baseSrcLogs.name, start: '$BASE_BLOCK_START' }],
  },
]

const backfillIntegrations: Integration[] = backfills.map((backfill) => ({
  ...createBackfillIntegration(backfill.integration),
  enabled: true,
  sources: [{ name: baseSrcLogs.name, start: backfill.start }],
}))

const c = makeConfig({
  pg_url: '$DATABASE_URL',
  sources,
  integrations: [...integrations, ...backfillIntegrations],
  dashboard: {
    root_password: '$DASHBOARD_ROOT_PASSWORD',
  },
})

export const config = c
