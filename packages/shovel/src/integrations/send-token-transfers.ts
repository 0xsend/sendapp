import type { BlockData, Column, Integration, Table } from '@indexsupply/shovel-config'
import { sendTokenAddress } from '@my/wagmi'

export const transfersTable: Table = {
  name: 'send_token_transfers',
  columns: [
    { name: 'chain_id', type: 'numeric' },
    { name: 'log_addr', type: 'bytea' },
    { name: 'block_time', type: 'numeric' },
    { name: 'f', type: 'bytea' },
    { name: 't', type: 'bytea' },
    { name: 'v', type: 'numeric' },
  ] as Column[],
} as const

export const integration: Omit<Integration, 'sources'> = {
  name: 'send_token_transfers',
  enabled: true,
  table: transfersTable,
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
      name: 'log_addr',
      column: 'log_addr',
      filter_op: 'contains',
      filter_arg: [...new Set(Object.values(sendTokenAddress))],
    },
  ] as BlockData[],
  event: {
    type: 'event',
    name: 'Transfer',
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: 'from',
        type: 'address',
        column: 'f',
      },
      {
        indexed: true,
        name: 'to',
        type: 'address',
        column: 't',
      },
      {
        indexed: false,
        name: 'value',
        type: 'uint256',
        column: 'v',
      },
    ],
  },
} as const
