import type { BlockData, Column, Integration, Table } from '@indexsupply/shovel-config'
import { sendAccountFactorySenderFilterRef } from './send-account-deployed'
import { entryPointAddress } from '@my/wagmi'

export const sendAccountTransactionsTable: Table = {
  name: 'send_account_txs',
  columns: [
    { name: 'chain_id', type: 'numeric' },
    { name: 'block_hash', type: 'bytea' },
    { name: 'block_num', type: 'numeric' },
    { name: 'block_time', type: 'numeric' },
    { name: 'tx_hash', type: 'bytea' },
    { name: 'tx_idx', type: 'numeric' },
    { name: 'tx_signer', type: 'bytea' },
    { name: 'tx_to', type: 'bytea' },
    { name: 'tx_value', type: 'numeric' },
    { name: 'tx_input', type: 'bytea' },
    { name: 'log_idx', type: 'numeric' },
    { name: 'log_addr', type: 'bytea' },
    { name: 'uop', type: 'bytea' },
    { name: 'sender', type: 'bytea' },
    { name: 'paymaster', type: 'bytea' },
    { name: 'nonce', type: 'numeric' },
    { name: 'success', type: 'bool' },
    { name: 'gas_cost', type: 'numeric' },
    { name: 'gas_used', type: 'numeric' },
  ] as Column[],
} as const

export const integration: Omit<Integration, 'sources'> = {
  name: 'send_account_txs',
  enabled: true,
  block: [
    { name: 'chain_id', column: 'chain_id' },
    { name: 'block_hash', column: 'block_hash' },
    { name: 'block_num', column: 'block_num' },
    { name: 'block_time', column: 'block_time' },
    { name: 'tx_hash', column: 'tx_hash' },
    { name: 'tx_idx', column: 'tx_idx' },
    {
      name: 'tx_signer',
      column: 'tx_signer',
    },
    {
      name: 'tx_to',
      column: 'tx_to',
      filter_op: 'contains',
      filter_ref: sendAccountFactorySenderFilterRef,
    },
    { name: 'tx_value', column: 'tx_value' },
    { name: 'tx_input', column: 'tx_input' },
    { name: 'log_idx', column: 'log_idx' },
    {
      name: 'log_addr',
      column: 'log_addr',
      filter_op: 'contains',
      filter_arg: [...new Set(Object.values(entryPointAddress))] as `0x${string}`[],
    },
  ] as BlockData[],
  table: sendAccountTransactionsTable,
  event: {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'userOpHash', column: 'uop', type: 'bytes32', indexed: true },
      {
        name: 'sender',
        column: 'sender',
        type: 'address',
        indexed: true,
        filter_op: 'contains',
        filter_ref: sendAccountFactorySenderFilterRef,
      },
      { name: 'paymaster', column: 'paymaster', type: 'address', indexed: true },
      { name: 'nonce', column: 'nonce', type: 'uint256', indexed: false },
      { name: 'success', column: 'success', type: 'bool', indexed: false },
      { name: 'actualGasCost', column: 'gas_cost', type: 'uint256', indexed: false },
      { name: 'actualGasUsed', column: 'gas_used', type: 'uint256', indexed: false },
    ],
    name: 'UserOperationEvent',
  },
} as const
