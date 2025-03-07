import type {
  BlockData,
  Column,
  FilterReference,
  Integration,
  Table,
} from '@indexsupply/shovel-config'
import { sendEarnUsdcFactoryAddress } from '@my/wagmi'

export const sendEarnCreate: Table = {
  name: 'send_earn_create',
  columns: [
    { name: 'chain_id', type: 'numeric' },
    { name: 'log_addr', type: 'bytea' },
    { name: 'block_time', type: 'numeric' },
    { name: 'tx_hash', type: 'bytea' },
    { name: 'send_earn', type: 'bytea' },
    { name: 'caller', type: 'bytea' },
    { name: 'initial_owner', type: 'bytea' },
    { name: 'vault', type: 'bytea' },
    { name: 'fee_recipient', type: 'bytea' },
    { name: 'collections', type: 'bytea' },
    { name: 'fee', type: 'numeric' },
    { name: 'salt', type: 'bytea' },
  ] as Column[],
} as const

export const sendEarnCreateFilterRef: FilterReference = {
  integration: sendEarnCreate.name,
  column: 'send_earn',
}

export const integration: Omit<Integration, 'sources'> = {
  name: sendEarnCreate.name,
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
      filter_arg: [...new Set(Object.values(sendEarnUsdcFactoryAddress))].sort() as `0x${string}`[],
    },
  ] as BlockData[],
  event: {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'sendEarn', type: 'address', indexed: true, column: 'send_earn' },
      { name: 'caller', type: 'address', indexed: true, column: 'caller' },
      { name: 'initialOwner', type: 'address', indexed: false, column: 'initial_owner' },
      { name: 'vault', type: 'address', indexed: true, column: 'vault' },
      { name: 'feeRecipient', type: 'address', indexed: false, column: 'fee_recipient' },
      { name: 'collections', type: 'address', indexed: false, column: 'collections' },
      { name: 'fee', type: 'uint96', indexed: false, column: 'fee' },
      { name: 'salt', type: 'bytes32', indexed: false, column: 'salt' },
    ],
    name: 'CreateSendEarn',
  },
  table: sendEarnCreate,
} as const
