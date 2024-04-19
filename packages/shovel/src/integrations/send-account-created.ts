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
  name: 'send_account_created',
  columns: [
    { name: 'chain_id', type: 'numeric' },
    { name: 'log_addr', type: 'bytea' },
    { name: 'block_time', type: 'numeric' },
    { name: 'user_op_hash', type: 'bytea' },
    { name: 'tx_hash', type: 'bytea' },
    { name: 'account', type: 'bytea' },
  ] as Column[],
} as const

export const sendAccountFactorySenderFilterRef: FilterReference = {
  integration: sendAcctFactoryTable.name,
  column: 'account',
}

export const integration: Omit<Integration, 'sources'> = {
  name: 'send_account_created',
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
      filter_arg: [...new Set(Object.values(sendAccountFactoryAddress))].sort() as `0x${string}`[],
    },
  ] as BlockData[],
  event: {
    type: 'event',
    anonymous: false,
    inputs: [{ name: 'account', type: 'address', indexed: true, column: 'account' }],
    name: 'AccountCreated',
  },
  table: sendAcctFactoryTable,
} as const
