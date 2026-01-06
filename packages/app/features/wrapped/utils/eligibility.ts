import type { WrappedData } from '../types'

/**
 * Checks if a user is eligible for Send Wrapped 2025
 * @param sendId - The user's Send ID
 * @returns true if the user is eligible, false otherwise
 *
 * NOTE: Feature disabled for 2025. Set to return false to stop showing
 * the wrapped feature to users. Code is preserved for potential reuse.
 */
export function isEligibleForWrapped(_sendId: number | undefined | null): boolean {
  return false
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
