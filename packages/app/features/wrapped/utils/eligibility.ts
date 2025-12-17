import type { WrappedData } from '../types'

/**
 * Hardcoded list of Send IDs eligible for Wrapped 2025
 * Add eligible user Send IDs to this array
 */
const ELIGIBLE_SEND_IDS: number[] = [
  47446, // dev
  38282, // milf
  2, // 3
  1, // bigboss
  3409, // vic
  3941, // erick
  117902, // ehsan
]

/**
 * Checks if a user is eligible for Send Wrapped 2025
 * @param sendId - The user's Send ID
 * @returns true if the user is eligible, false otherwise
 */
export function isEligibleForWrapped(sendId: number | undefined | null): boolean {
  if (!sendId) return false
  return ELIGIBLE_SEND_IDS.includes(sendId)
}

/**
 * Checks if wrapped data has enough content to display
 * @param data - The wrapped data to validate
 * @returns true if the data has sufficient content, false otherwise
 */
export function hasEnoughWrappedData(data: WrappedData | null): boolean {
  if (!data) return false

  // Check minimum requirements
  const hasTopCounterparties = data.topCounterparties.length >= 5
  const hasTransfers = data.totalTransfers > 0
  const hasRecipients = data.uniqueRecipients > 0

  return hasTopCounterparties && hasTransfers && hasRecipients
}
