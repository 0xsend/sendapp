import type { BlockData, Column, Integration, Table } from '@indexsupply/shovel-config'
import { sendtagCheckoutAddress } from '@my/wagmi'

export const table: Table = {
  name: 'sendtag_checkout_receipts',
  columns: [
    { name: 'chain_id', type: 'numeric' },
    { name: 'log_addr', type: 'bytea' },
    { name: 'block_time', type: 'numeric' },
    { name: 'tx_hash', type: 'bytea' },
    { name: 'sender', type: 'bytea' },
    { name: 'amount', type: 'numeric' },
    { name: 'referrer', type: 'bytea' },
    { name: 'reward', type: 'numeric' },
  ] as Column[],
} as const

export const integration: Omit<Integration, 'sources'> = {
  name: 'sendtag_checkout_receipts',
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
      filter_arg: [...new Set(Object.values(sendtagCheckoutAddress))],
    },
  ] as BlockData[],
  event: {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'sender', column: 'sender', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'amount',
        column: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        name: 'referrer',
        column: 'referrer',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
      {
        name: 'reward',
        column: 'reward',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Receipt',
  },
} as const
