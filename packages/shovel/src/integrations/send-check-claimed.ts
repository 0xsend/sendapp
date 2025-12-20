import type { BlockData, Column, Integration, Table } from '@indexsupply/shovel-config'

// TODO: Import from @my/wagmi/generated once deployed to mainnet
// import { sendCheckAddress } from '@my/wagmi/generated'
// Local dev address (CREATE2 with salt=0 from anvil deployer)
const SEND_CHECK_ADDRESS = '0x11eeF3894EcDCA6cCD5186c8FBB0BD4F6a928403'

export const sendCheckClaimedTable: Table = {
  name: 'send_check_claimed',
  columns: [
    { name: 'chain_id', type: 'numeric', constraints: 'PRIMARY KEY' },
    { name: 'block_num', type: 'numeric', constraints: 'PRIMARY KEY' },
    { name: 'log_idx', type: 'numeric', constraints: 'PRIMARY KEY' },
    { name: 'block_time', type: 'numeric' },
    { name: 'tx_hash', type: 'bytea' },
    { name: 'tx_idx', type: 'numeric' },
    { name: 'log_addr', type: 'bytea' },
    { name: 'ephemeral_address', type: 'bytea' },
    { name: 'sender', type: 'bytea' },
    { name: 'amount', type: 'numeric' },
    { name: 'token', type: 'bytea' },
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
      filter_op: 'eq',
      filter_arg: [SEND_CHECK_ADDRESS],
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
          { name: 'amount', type: 'uint256', column: 'amount' },
          { name: 'token', type: 'address', column: 'token' },
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
