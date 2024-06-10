import type { BlockData, Column, Integration, Table } from '@indexsupply/shovel-config'
import { sendAccountFactorySenderFilterRef } from './send-account-created'

export const table: Table = {
  name: 'send_account_signing_key_added',
  columns: [
    { name: 'chain_id', type: 'numeric' },
    { name: 'log_addr', type: 'bytea' },
    { name: 'block_time', type: 'numeric' },
    { name: 'tx_hash', type: 'bytea' },
    { name: 'account', type: 'bytea' },
    { name: 'key_slot', type: 'smallint' },
    { name: 'key', type: 'bytea' },
  ] as Column[],
} as const

export const integration: Omit<Integration, 'sources'> = {
  name: 'send_account_signing_key_added',
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
      filter_ref: sendAccountFactorySenderFilterRef,
    },
  ] as BlockData[],
  event: {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'account',
        type: 'address',
        indexed: true,
        column: 'account',
      },
      { name: 'keySlot', type: 'uint8', indexed: false, column: 'key_slot' },
      { name: 'key', type: 'bytes32[2]', indexed: false, column: 'key' },
    ],
    name: 'SigningKeyAdded',
  },
  table: table,
} as const
