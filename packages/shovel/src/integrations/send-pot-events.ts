import type { BlockData, Column, Integration, Table } from '@indexsupply/shovel-config'

const SEND_POT_CONTRACT_ADDRESS = '0xa0A5611b9A1071a1D8A308882065c48650bAeE8b'

// --- UserTicketPurchase Event ---
export const sendPotUserTicketPurchasesTable: Table = {
  name: 'send_pot_user_ticket_purchases',
  columns: [
    { name: 'chain_id', type: 'numeric', constraints: 'PRIMARY KEY' },
    { name: 'block_num', type: 'numeric', constraints: 'PRIMARY KEY' },
    { name: 'log_idx', type: 'numeric', constraints: 'PRIMARY KEY' },
    { name: 'block_time', type: 'numeric' },
    { name: 'tx_hash', type: 'bytea' },
    { name: 'tx_idx', type: 'numeric' },
    { name: 'log_addr', type: 'bytea' }, // Contract address
    { name: 'recipient', type: 'bytea' }, // indexed address
    { name: 'tickets_purchased_total_bps', type: 'numeric' }, // uint256
    { name: 'referrer', type: 'bytea' }, // indexed address
    { name: 'buyer', type: 'bytea' }, // indexed address
  ] as Column[],
} as const

export const userTicketPurchaseIntegration: Omit<Integration, 'sources'> = {
  name: 'send_pot_user_ticket_purchases',
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
      filter_op: 'equals', // Filter for the specific SendPot contract
      filter_val: SEND_POT_CONTRACT_ADDRESS,
    },
  ] as BlockData[],
  table: sendPotUserTicketPurchasesTable,
  event: {
    type: 'event',
    anonymous: false,
    name: 'UserTicketPurchase',
    inputs: [
      {
        column: 'recipient',
        name: 'recipient',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        column: 'tickets_purchased_total_bps',
        name: 'ticketsPurchasedTotalBps',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        column: 'referrer',
        name: 'referrer',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        column: 'buyer',
        name: 'buyer',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
    ],
  },
} as const

// --- JackpotRun Event ---

export const sendPotJackpotRunsTable: Table = {
  name: 'send_pot_jackpot_runs',
  columns: [
    { name: 'chain_id', type: 'numeric', constraints: 'PRIMARY KEY' },
    { name: 'block_num', type: 'numeric', constraints: 'PRIMARY KEY' },
    { name: 'log_idx', type: 'numeric', constraints: 'PRIMARY KEY' },
    { name: 'block_time', type: 'numeric' },
    { name: 'tx_hash', type: 'bytea' },
    { name: 'tx_idx', type: 'numeric' },
    { name: 'log_addr', type: 'bytea' }, // Contract address
    { name: 'time', type: 'numeric' }, // uint256
    { name: 'winner', type: 'bytea' }, // address
    { name: 'winning_ticket', type: 'numeric' }, // uint256
    { name: 'win_amount', type: 'numeric' }, // uint256
    { name: 'tickets_purchased_total_bps', type: 'numeric' }, // uint256
  ] as Column[],
} as const

export const jackpotRunIntegration: Omit<Integration, 'sources'> = {
  name: 'send_pot_jackpot_runs',
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
      filter_op: 'equals', // Filter for the specific SendPot contract
      filter_val: SEND_POT_CONTRACT_ADDRESS,
    },
  ] as BlockData[],
  table: sendPotJackpotRunsTable,
  event: {
    type: 'event',
    anonymous: false,
    name: 'JackpotRun',
    inputs: [
      { column: 'time', name: 'time', internalType: 'uint256', type: 'uint256', indexed: false },
      {
        column: 'winner',
        name: 'winner',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
      {
        column: 'winning_ticket',
        name: 'winningTicket',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        column: 'win_amount',
        name: 'winAmount',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
      {
        column: 'tickets_purchased_total_bps',
        name: 'ticketsPurchasedTotalBps',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
  },
} as const
