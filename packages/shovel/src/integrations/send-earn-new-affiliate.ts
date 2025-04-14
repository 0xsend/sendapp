import type {
  BlockData,
  Column,
  FilterReference,
  Integration,
  Table,
} from '@indexsupply/shovel-config'
import { sendEarnUsdcFactoryAddress } from '@my/wagmi'

export const sendEarnNewAffiliate: Table = {
  name: 'send_earn_new_affiliate',
  columns: [
    { name: 'chain_id', type: 'numeric' },
    { name: 'log_addr', type: 'bytea' },
    { name: 'block_time', type: 'numeric' },
    { name: 'tx_hash', type: 'bytea' },
    { name: 'affiliate', type: 'bytea' },
    { name: 'send_earn_affiliate', type: 'bytea' },
  ] as Column[],
} as const

export const sendEarnNewAffiliateFilterRef: FilterReference = {
  integration: sendEarnNewAffiliate.name,
  column: 'send_earn_affiliate',
}

export const integration: Omit<Integration, 'sources'> = {
  name: sendEarnNewAffiliate.name,
  enabled: true,
  block: [
    {
      name: 'chain_id',
      column: 'chain_id',
    },
    {
      name: 'block_time',
      column: 'block_time',
    },
    {
      name: 'tx_hash',
      column: 'tx_hash',
    },
    {
      name: 'log_addr',
      column: 'log_addr',
      filter_op: 'contains',
      filter_arg: [...new Set(Object.values(sendEarnUsdcFactoryAddress))].sort() as `0x${string}`[],
    },
  ] as BlockData[],
  event: {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'affiliate', type: 'address', indexed: false, column: 'affiliate' },
      {
        name: 'send_earn_affiliate',
        type: 'address',
        indexed: false,
        column: 'send_earn_affiliate',
      },
    ],
    name: 'NewAffiliate',
  },
  table: sendEarnNewAffiliate,
} as const
