import type { WrappedData } from '../types'

/**
 * Checks if a user is eligible for Send Wrapped 2025
 * @param sendId - The user's Send ID
 * @returns true if the user is eligible, false otherwise
 */
export function isEligibleForWrapped(sendId: number | undefined | null): boolean {
  if (!sendId) return false
  return true
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
