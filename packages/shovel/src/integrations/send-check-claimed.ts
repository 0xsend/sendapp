import type { BlockData, Column, Integration, Table } from '@indexsupply/shovel-config'
import { sendCheckAddress } from '@my/wagmi'

export const sendCheckClaimedTable: Table = {
  name: 'send_check_claimed',
  columns: [
    { name: 'chain_id', type: 'numeric' },
    { name: 'block_time', type: 'numeric' },
    { name: 'tx_hash', type: 'bytea' },
    { name: 'log_addr', type: 'bytea' },
    { name: 'token', type: 'bytea' },
    { name: 'amount', type: 'numeric' },
    { name: 'from', type: 'bytea' },
    { name: 'redeemer', type: 'bytea' },
  ] as Column[],
} as const

export const integration: Omit<Integration, 'sources'> = {
  name: 'send_check_claimed',
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
      filter_arg: [...new Set(Object.values(sendCheckAddress))].sort() as `0x${string}`[],
    },
  ] as BlockData[],
  event: {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'token',
        type: 'address',
        indexed: false,
        column: 'token',
      },
      {
        name: 'amount',
        type: 'uint256',
        indexed: false,
        column: 'amount',
      },
      {
        name: 'from',
        type: 'address',
        indexed: false,
        column: 'from',
      },
      {
        name: 'redeemer',
        type: 'address',
        indexed: false,
        column: 'redeemer',
      },
    ],
    name: 'CheckClaimed',
  },
  table: sendCheckClaimedTable,
} as const
