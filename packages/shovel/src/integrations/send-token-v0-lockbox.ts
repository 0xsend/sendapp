import type { BlockData, Column, Integration, Table } from '@indexsupply/shovel-config'
import { sendTokenV0LockboxAddress } from '@my/wagmi'

export const table: Table = {
  name: 'send_token_v0_lockbox',
  columns: [
    { name: 'chain_id', type: 'numeric' },
    { name: 'log_addr', type: 'bytea' },
    { name: 'block_time', type: 'numeric' },
    { name: 'tx_hash', type: 'bytea' },
    { name: 'to', type: 'bytea' },
    { name: 'amount', type: 'numeric' },
  ] as Column[],
} as const

export const integration: Omit<Integration, 'sources'> = {
  name: 'send_token_v0_lockbox',
  enabled: true,
  table,
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
      filter_arg: [...new Set(Object.values(sendTokenV0LockboxAddress))],
    },
  ] as BlockData[],
  event: {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'to', column: 'to', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'amount',
        column: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Deposit',
  },
} as const
