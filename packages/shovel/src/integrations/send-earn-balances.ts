import type { BlockData, Column, Integration, Table } from '@indexsupply/shovel-config'

export const sendEarnBalances: Table = {
  name: 'send_earn_balances',
  columns: [
    { name: 'chain_id', type: 'numeric' },
    { name: 'log_addr', type: 'bytea' },
    { name: 'block_time', type: 'numeric' },
    { name: 'tx_hash', type: 'bytea' },
    { name: 'balance', type: 'numeric' },
    { name: 'ig_name', type: 'text' },
    { name: 'src_name', type: 'text' },
    { name: 'block_num', type: 'numeric' },
    { name: 'tx_idx', type: 'integer' },
    { name: 'log_idx', type: 'integer' },
    { name: 'abi_idx', type: 'smallint' },
  ] as Column[],
} as const

export const integration: Omit<Integration, 'sources'> = {
  name: sendEarnBalances.name,
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
      name: 'block_num',
      column: 'block_num',
    },
    {
      name: 'tx_hash',
      column: 'tx_hash',
    },
    {
      name: 'tx_idx',
      column: 'tx_idx',
    },
    {
      name: 'log_idx',
      column: 'log_idx',
    },
    {
      name: 'log_addr',
      column: 'log_addr',
    },
    {
      name: 'ig_name',
      column: 'ig_name',
    },
    {
      name: 'src_name',
      column: 'src_name',
    },
    {
      name: 'abi_idx',
      column: 'abi_idx',
    },
  ] as BlockData[],
  event: {
    type: 'event',
    anonymous: false,
    inputs: [{ name: 'updatedTotalAssets', type: 'uint256', indexed: false, column: 'balance' }],
    name: 'UpdateLastTotalAssets',
  },
  table: sendEarnBalances,
} as const
