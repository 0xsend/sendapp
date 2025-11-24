export const SENDPOT_CONTRACT_ADDRESS = '0xa0A5611b9A1071a1D8A308882065c48650bAeE8b'

// Constant for actual cost of the ticket for user (in SEND wei)
export const COST_PER_TICKET_WEI = 30000000000000000000n

// Base ticket value in basis points (for reference)
export const BASE_TICKET_BPS = 10000

// Hardcoded BPS per ticket value for approximate display only
// Only used in rewards activity screen for showing verification weights
// Note: This is approximate and doesn't reflect actual historical fees
// - Block 0-38567473: feeBps=3000 → net 7000 BPS/ticket
// - Block 38567474+: feeBps=7000 → net 3000 BPS/ticket
// @deprecated Use tickets_purchased_count from database for accurate data
export const BPS_PER_TICKET = 7000

export const MAX_JACKPOT_HISTORY = 5

export const NO_WINNER_ADDRESS: `0x${string}` = '0x0000000000000000000000000000000000000000'

export const calculateTicketsFromWei = (totalSendWei: bigint) => {
  return totalSendWei / COST_PER_TICKET_WEI
}

/**
 * Calculates approximate tickets from BPS for display purposes only.
 * Uses a hardcoded BPS_PER_TICKET value that doesn't account for historical fee changes.
 *
 * @deprecated Use tickets_purchased_count from database for accurate historical data.
 * This is only kept for displaying distribution verification weights in the rewards screen.
 *
 * @param bps - The basis points to convert to tickets
 * @returns Approximate number of tickets (for display only)
 */
export const calculateTicketsFromBps = (bps: number): number => {
  if (bps <= 0 || BPS_PER_TICKET <= 0) {
    return 0
  }
  return Math.floor(bps / BPS_PER_TICKET)
}
