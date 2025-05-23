import type { BlockData, Column, Integration, Table } from '@indexsupply/shovel-config'

export const sendEarnWithdraw: Table = {
  name: 'send_earn_withdraw',
  columns: [
    { name: 'chain_id', type: 'numeric' },
    { name: 'log_addr', type: 'bytea' },
    { name: 'block_time', type: 'numeric' },
    { name: 'tx_hash', type: 'bytea' },
    { name: 'sender', type: 'bytea' },
    { name: 'receiver', type: 'bytea' },
    { name: 'owner', type: 'bytea' },
    { name: 'assets', type: 'numeric' },
    { name: 'shares', type: 'numeric' },
  ] as Column[],
} as const

export const integration: Omit<Integration, 'sources'> = {
  name: sendEarnWithdraw.name,
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
    },
  ] as BlockData[],
  event: {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'sender', type: 'address', indexed: true, column: 'sender' },
      { name: 'receiver', type: 'address', indexed: true, column: 'receiver' },
      { name: 'owner', type: 'address', indexed: true, column: 'owner' },
      { name: 'assets', type: 'uint256', indexed: false, column: 'assets' },
      { name: 'shares', type: 'uint256', indexed: false, column: 'shares' },
    ],
    name: 'Withdraw',
  },
  table: sendEarnWithdraw,
} as const
