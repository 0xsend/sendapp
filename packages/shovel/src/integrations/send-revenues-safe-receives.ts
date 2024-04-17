import type { BlockData, Column, Integration, Table } from '@indexsupply/shovel-config'
import { sendRevenueSafeAddress } from '@my/wagmi'

export const sendRevenuesSafeReceivesTable: Table = {
  name: 'send_revenues_safe_receives',
  columns: [
    { name: 'chain_id', type: 'numeric' },
    { name: 'log_addr', type: 'bytea' },
    { name: 'block_time', type: 'numeric' },
    { name: 'tx_hash', type: 'bytea' },
    { name: 'sender', type: 'bytea' },
    { name: 'v', type: 'numeric' },
  ] as Column[],
} as const

export const integration: Omit<Integration, 'sources'> = {
  name: 'send_revenues_safe_receives',
  enabled: true,
  table: sendRevenuesSafeReceivesTable,
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
      filter_arg: [...new Set(Object.values(sendRevenueSafeAddress))].sort(),
    },
  ] as BlockData[],
  event: {
    type: 'event',
    name: 'SafeReceived',
    inputs: [
      {
        name: 'sender',
        internalType: 'address',
        type: 'address',
        indexed: true,
        column: 'sender',
      },
      {
        name: 'value',
        type: 'uint256',
        indexed: false,
        column: 'v',
      },
    ],
  },
} as const
