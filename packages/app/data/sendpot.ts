export const SEND_POT_CONTRACT_ADDRESS = '0xa0A5611b9A1071a1D8A308882065c48650bAeE8b'

// Constant for basis points per ticket
export const BPS_PER_TICKET = 7000

/**
 * Calculates the actual number of tickets from the total basis points purchased.
 * @param bps - The total basis points representing tickets purchased.
 * @returns The actual number of tickets.
 */
export const calculateActualTickets = (bps: number): number => {
  if (bps <= 0 || BPS_PER_TICKET <= 0) {
    return 0
  }
  // Use Math.floor or Math.round depending on desired behavior for partial tickets
  return Math.floor(bps / BPS_PER_TICKET)
}
