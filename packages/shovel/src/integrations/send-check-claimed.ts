import type { BlockData, Column, Integration, Table } from '@indexsupply/shovel-config'
import { sendCheckAddress } from '@my/wagmi/generated'

export const sendCheckClaimedTable: Table = {
  name: 'send_check_claimed',
  columns: [
    { name: 'chain_id', type: 'numeric' },
    { name: 'block_num', type: 'numeric' },
    { name: 'log_idx', type: 'numeric' },
    { name: 'block_time', type: 'numeric' },
    { name: 'tx_hash', type: 'bytea' },
    { name: 'tx_idx', type: 'numeric' },
    { name: 'log_addr', type: 'bytea' },
    { name: 'ephemeral_address', type: 'bytea' },
    { name: 'sender', type: 'bytea' },
    { name: 'token', type: 'bytea' },
    { name: 'amount', type: 'numeric' },
    { name: 'expires_at', type: 'numeric' },
    { name: 'redeemer', type: 'bytea' },
  ] as Column[],
} as const

export const integration: Omit<Integration, 'sources'> = {
  name: 'send_check_claimed',
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
      filter_arg: [...new Set(Object.values(sendCheckAddress))].sort() as `0x${string}`[],
    },
  ] as BlockData[],
  table: sendCheckClaimedTable,
  event: {
    type: 'event',
    anonymous: false,
    name: 'CheckClaimed',
    inputs: [
      {
        name: 'check',
        type: 'tuple',
        indexed: false,
        components: [
          { name: 'ephemeralAddress', type: 'address', column: 'ephemeral_address' },
          { name: 'from', type: 'address', column: 'sender' },
          {
            name: 'amounts',
            type: 'tuple[]',
            components: [
              { name: 'token', type: 'address', column: 'token' },
              { name: 'amount', type: 'uint256', column: 'amount' },
            ],
          },
          { name: 'expiresAt', type: 'uint256', column: 'expires_at' },
        ],
      },
      {
        name: 'redeemer',
        type: 'address',
        indexed: false,
        column: 'redeemer',
      },
    ],
  },
} as const
