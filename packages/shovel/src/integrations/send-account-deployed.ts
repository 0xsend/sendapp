import type {
  BlockData,
  Column,
  FilterReference,
  Integration,
  Table,
} from '@indexsupply/shovel-config'
import { sendAccountFactoryAddress } from '@my/wagmi'
import { ENTRYPOINT_ADDRESS_V07 } from 'permissionless'

export const sendAcctFactoryTable: Table = {
  name: 'send_account_deployed',
  columns: [
    { name: 'chain_id', type: 'numeric' },
    { name: 'log_addr', type: 'bytea' },
    { name: 'block_time', type: 'numeric' },
    { name: 'user_op_hash', type: 'bytea' },
    { name: 'tx_hash', type: 'bytea' },
    { name: 'sender', type: 'bytea' },
    { name: 'factory', type: 'bytea' },
    { name: 'paymaster', type: 'bytea' },
  ] as Column[],
} as const

export const sendAccountFactorySenderFilterRef: FilterReference = {
  integration: sendAcctFactoryTable.name,
  column: 'sender',
}

export const integration: Omit<Integration, 'sources'> = {
  name: 'send_account_deployed',
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
      filter_arg: [ENTRYPOINT_ADDRESS_V07],
    },
  ] as BlockData[],
  event: {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'userOpHash', type: 'bytes32', indexed: true, column: 'user_op_hash' },
      { name: 'sender', type: 'address', indexed: true, column: 'sender' },
      {
        name: 'factory',
        type: 'address',
        indexed: false,
        column: 'factory',
        filter_op: 'contains',
        filter_arg: [
          ...new Set(Object.values(sendAccountFactoryAddress)),
        ].sort() as `0x${string}`[],
      },
      { name: 'paymaster', type: 'address', indexed: false, column: 'paymaster' },
    ],
    name: 'AccountDeployed',
  },
  table: sendAcctFactoryTable,
} as const
