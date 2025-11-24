export const SENDPOT_CONTRACT_ADDRESS = '0xa0A5611b9A1071a1D8A308882065c48650bAeE8b'

// Constant for actual cost of the ticket for user (in SEND wei)
export const COST_PER_TICKET_WEI = 30000000000000000000n

// Base ticket value in basis points
export const BASE_TICKET_BPS = 10000

// @deprecated Use calculateTicketsFromBpsWithFee() for accurate calculations
// This constant represents the current net BPS per ticket but doesn't account for historical fee changes
export const BPS_PER_TICKET = 7000

export const MAX_JACKPOT_HISTORY = 5

export const NO_WINNER_ADDRESS: `0x${string}` = '0x0000000000000000000000000000000000000000'

export const calculateTicketsFromWei = (totalSendWei: bigint) => {
  return totalSendWei / COST_PER_TICKET_WEI
}

/**
 * Calculates tickets from BPS using a specific feeBps value.
 * Use this for real-time calculations with current contract state.
 *
 * Formula: tickets = bps / (BASE_TICKET_BPS - feeBps)
 *
 * @param bps - The basis points to convert to tickets
 * @param feeBps - The fee in basis points (fetch from contract via RPC)
 * @returns The number of tickets
 *
 * @example
 * // Get current fee from contract
 * const feeBps = await readContract({
 *   address: baseJackpotAddress,
 *   abi: baseJackpotAbi,
 *   functionName: 'feeBps'
 * })
 * const tickets = calculateTicketsFromBpsWithFee(bpsDelta, Number(feeBps))
 */
export const calculateTicketsFromBpsWithFee = (bps: number, feeBps: number): number => {
  if (bps <= 0) {
    return 0
  }
  const netBpsPerTicket = BASE_TICKET_BPS - feeBps
  if (netBpsPerTicket <= 0) {
    throw new Error(`Invalid fee configuration: netBpsPerTicket = ${netBpsPerTicket}`)
  }
  return Math.floor(bps / netBpsPerTicket)
}

/**
 * @deprecated Use tickets_purchased_count from database for historical data.
 * For real-time calculations, use calculateTicketsFromBpsWithFee() instead.
 *
 * This function uses a hardcoded BPS_PER_TICKET value that doesn't account
 * for historical fee changes (fee increased from 3000 to 7000 at block 38567474).
 */
export const calculateTicketsFromBps = (bps: number): number => {
  if (bps <= 0 || BPS_PER_TICKET <= 0) {
    return 0
  }
  return Math.floor(bps / BPS_PER_TICKET)
}
