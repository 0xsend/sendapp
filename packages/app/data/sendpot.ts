export const SENDPOT_CONTRACT_ADDRESS = '0xa0A5611b9A1071a1D8A308882065c48650bAeE8b'

// Constant for actual cost of the ticket for user (in SEND wei)
export const COST_PER_TICKET_WEI = 30000000000000000000n

// Historical BPS per ticket values based on block time
// Add new entries when BPS changes, ordered from newest to oldest
const BPS_PER_TICKET_HISTORY: Array<{ blockTime: number; bps: number }> = [
  // TODO: Add your new BPS value and the block time when it took effect
  // { blockTime: 1234567890, bps: 8000 },
  { blockTime: 0, bps: 7000 }, // Original value
]

/**
 * Gets the BPS per ticket value for a given block time.
 * @param blockTime - The block timestamp to lookup the BPS value.
 * @returns The BPS per ticket value that was active at that time.
 */
export const getBpsPerTicket = (blockTime: number): number => {
  // Find the first entry where blockTime >= entry.blockTime
  // Since array is ordered newest to oldest, this gives us the correct value
  for (const entry of BPS_PER_TICKET_HISTORY) {
    if (blockTime >= entry.blockTime) {
      return entry.bps
    }
  }

  // Fallback to oldest value
  return BPS_PER_TICKET_HISTORY[BPS_PER_TICKET_HISTORY.length - 1].bps
}

export const MAX_JACKPOT_HISTORY = 5

export const NO_WINNER_ADDRESS: `0x${string}` = '0x0000000000000000000000000000000000000000'

export const calculateTicketsFromWei = (totalSendWei: bigint) => {
  return totalSendWei / COST_PER_TICKET_WEI
}

/**
 * Calculates the actual number of tickets from the total basis points purchased.
 * @param bps - The total basis points representing tickets purchased.
 * @param blockTime - Block timestamp to determine which BPS value to use.
 * @returns The actual number of tickets.
 */
export const calculateTicketsFromBps = (bps: number, blockTime: number): number => {
  const bpsPerTicket = getBpsPerTicket(blockTime)
  if (bps <= 0 || bpsPerTicket <= 0) {
    return 0
  }
  // Use Math.floor or Math.round depending on desired behavior for partial tickets
  return Math.floor(bps / bpsPerTicket)
}

/**
 * Calculates tickets from raw purchase data, accounting for BPS changes over time.
 * This handles cases where BPS_PER_TICKET changed during the period being calculated.
 *
 * @param purchases - Array of ticket purchase records with cumulative BPS, ordered by block_time ascending
 * @returns Total number of tickets
 *
 * @example
 * // If BPS changed from 7000 to 8000:
 * const purchases = [
 *   { block_time: 100, tickets_purchased_total_bps: 7000 },   // 1 ticket at 7000 BPS
 *   { block_time: 200, tickets_purchased_total_bps: 14000 },  // 1 ticket at 7000 BPS
 *   { block_time: 300, tickets_purchased_total_bps: 22000 },  // 1 ticket at 8000 BPS
 * ]
 * calculateTicketsFromRawPurchases(purchases) // Returns 3
 */
export const calculateTicketsFromRawPurchases = (
  purchases: Array<{ block_time: number; tickets_purchased_total_bps: number }>
): number => {
  if (purchases.length === 0) return 0

  let totalTickets = 0
  let previousCumulativeBps = 0

  for (const purchase of purchases) {
    // Calculate the delta BPS for this purchase
    const deltaBps = purchase.tickets_purchased_total_bps - previousCumulativeBps

    if (deltaBps > 0) {
      // Get the BPS per ticket rate at the time of this purchase
      const bpsPerTicket = getBpsPerTicket(purchase.block_time)

      // Calculate tickets for this purchase
      const ticketsForThisPurchase = Math.floor(deltaBps / bpsPerTicket)
      totalTickets += ticketsForThisPurchase
    }

    previousCumulativeBps = purchase.tickets_purchased_total_bps
  }

  return totalTickets
}
