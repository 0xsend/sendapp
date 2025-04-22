export const SENDPOT_CONTRACT_ADDRESS = '0xa0A5611b9A1071a1D8A308882065c48650bAeE8b'

// Constant for actual cost of the ticket for user (in SEND wei)
export const COST_PER_TICKET_WEI = 30000000000000000000n

// Constant for basis points per ticket
export const BPS_PER_TICKET = 7000

export const MAX_JACKPOT_HISTORY = 5

export const NO_WINNER_ADDRESS: `0x${string}` = '0x0000000000000000000000000000000000000000'

export const calculateTicketsFromWei = (totalSendWei: bigint) => {
  return totalSendWei / COST_PER_TICKET_WEI
}

/**
 * Calculates the actual number of tickets from the total basis points purchased.
 * @param bps - The total basis points representing tickets purchased.
 * @returns The actual number of tickets.
 */
export const calculateTicketsFromBps = (bps: number): number => {
  if (bps <= 0 || BPS_PER_TICKET <= 0) {
    return 0
  }
  // Use Math.floor or Math.round depending on desired behavior for partial tickets
  return Math.floor(bps / BPS_PER_TICKET)
}
