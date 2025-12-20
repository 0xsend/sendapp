import type { BlockData, Column, Integration, Table } from '@indexsupply/shovel-config'

// TODO: Import from @my/wagmi/generated once deployed to mainnet
// import { sendCheckAddress } from '@my/wagmi/generated'
// Local dev address (CREATE2 with salt=0 from anvil deployer)
const SEND_CHECK_ADDRESS = '0x11eeF3894EcDCA6cCD5186c8FBB0BD4F6a928403'

export const sendCheckCreatedTable: Table = {
  name: 'send_check_created',
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
    { name: 'tokens', type: 'bytea' },
    { name: 'amounts', type: 'bytea' },
    { name: 'expires_at', type: 'numeric' },
  ] as Column[],
} as const

export const integration: Omit<Integration, 'sources'> = {
  name: 'send_check_created',
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
  table: sendCheckCreatedTable,
  event: {
    type: 'event',
    anonymous: false,
    name: 'CheckCreated',
    inputs: [
      {
        name: 'check',
        type: 'tuple',
        indexed: false,
        components: [
          { name: 'ephemeralAddress', type: 'address', column: 'ephemeral_address' },
          { name: 'from', type: 'address', column: 'sender' },
          { name: 'tokens', type: 'address[]', column: 'tokens' },
          { name: 'amounts', type: 'uint256[]', column: 'amounts' },
          { name: 'expiresAt', type: 'uint256', column: 'expires_at' },
        ],
      },
    ],
  },
} as const
