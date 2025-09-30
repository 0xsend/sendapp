import type { BlockData, Column, Integration, Table } from '@indexsupply/shovel-config'
// import { sendAccountFactorySenderFilterRef, sendAcctFactoryTable } from './send-account-deployed'

export const transfersTable: Table = {
  name: 'send_account_transfers',
  columns: [
    { name: 'chain_id', type: 'numeric' },
    { name: 'log_addr', type: 'bytea' },
    { name: 'block_time', type: 'numeric' },
    { name: 'tx_hash', type: 'bytea' },
    { name: 'f', type: 'bytea' },
    { name: 't', type: 'bytea' },
    { name: 'v', type: 'numeric' },
  ] as Column[],
} as const

export const integration: Omit<Integration, 'sources'> = {
  name: 'send_account_transfers',
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
    name: 'Transfer',
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: 'from',
        type: 'address',
        column: 'f',
        // wait for this https://github.com/orgs/indexsupply/discussions/268
        // filter_op: 'contains',
        // filter_ref: sendAccountFactorySenderFilterRef,
      },
      {
        indexed: true,
        name: 'to',
        type: 'address',
        column: 't',
        // wait for this https://github.com/orgs/indexsupply/discussions/268
        // filter_op: 'contains',
        // filter_ref: sendAccountFactorySenderFilterRef,
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
