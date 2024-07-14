import type {
  BlockData,
  Column,
  Event,
  EventInput,
  Integration,
  Table,
} from '@indexsupply/shovel-config'
import { sendtagCheckoutAddress } from '@my/wagmi'

export const sendAccountReferralRewardsTable: Table = {
  name: 'send_account_referral_rewards',
  columns: [
    { name: 'chain_id', type: 'numeric' },
    { name: 'block_num', type: 'numeric' },
    { name: 'block_time', type: 'numeric' },
    { name: 'tx_hash', type: 'bytea' },
    { name: 'tx_idx', type: 'numeric' },
    { name: 'log_idx', type: 'numeric' },
    { name: 'log_addr', type: 'bytea' },
    { name: 'referrer', type: 'bytea' },
    { name: 'referred', type: 'bytea' },
    { name: 'amount', type: 'numeric' },
  ] as Column[],
} as const

export const integration: Omit<Integration, 'sources'> = {
  name: 'send_account_referral_rewards',
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
      filter_arg: [...new Set(Object.values(sendtagCheckoutAddress))].sort() as `0x${string}`[],
    },
  ] as BlockData[],
  table: sendAccountReferralRewardsTable,
  event: {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'referrer',
        column: 'referrer',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'referred',
        column: 'referred',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
      {
        name: 'amount',
        column: 'amount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ] as EventInput[],
    name: 'ReferralReward',
  } as Event,
} as const
