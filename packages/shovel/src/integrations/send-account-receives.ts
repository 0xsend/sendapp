import type { BlockData, Column, Integration, Table } from '@indexsupply/shovel-config'
import { sendAccountFactorySenderFilterRef } from './send-account-created'

export const sendAccountReceivesTable: Table = {
  name: 'send_account_receives',
  columns: [
    { name: 'chain_id', type: 'numeric' },
    { name: 'block_num', type: 'numeric' },
    { name: 'block_time', type: 'numeric' },
    { name: 'tx_hash', type: 'bytea' },
    { name: 'tx_idx', type: 'numeric' },
    { name: 'log_idx', type: 'numeric' },
    { name: 'log_addr', type: 'bytea' },
    { name: 'sender', type: 'bytea' },
    { name: 'value', type: 'numeric' },
  ] as Column[],
} as const

export const integration: Omit<Integration, 'sources'> = {
  name: 'send_account_receives',
  enabled: true,
  block: [
    { name: 'chain_id', column: 'chain_id' },
    { name: 'block_num', column: 'block_num' },
    { name: 'block_time', column: 'block_time' },
    { name: 'tx_hash', column: 'tx_hash' },
    { name: 'tx_idx', column: 'tx_idx' },
    { name: 'log_idx', column: 'log_idx' },
    {
      name: 'log_addr',
      column: 'log_addr',
      filter_op: 'contains',
      filter_ref: sendAccountFactorySenderFilterRef,
    },
  ] as BlockData[],
  table: sendAccountReceivesTable,
  event: {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        column: 'sender',
        name: 'sender',
        internalType: 'address',
        type: 'address',
        indexed: true,
        filter_op: 'contains',
        filter_ref: sendAccountFactorySenderFilterRef,
      },
      { column: 'value', name: 'value', internalType: 'uint256', type: 'uint256', indexed: false },
    ],
    name: 'Received',
  },
} as const
