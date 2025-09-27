/**
 * Utility function for calculating actual dollar changes from percentage changes
 *
 * This function correctly handles percentage changes > 100% by calculating
 * the actual dollar change from the previous value to the current value,
 * rather than applying the percentage to the current value.
 *
 * @param currentValue - The current USD value
 * @param percentageChange - The percentage change (e.g., 50 for 50% increase)
 * @returns The actual dollar change from the previous period to now
 */
export function calculatePercentageChange(
  currentValue: number,
  percentageChange: number | null
): number {
  if (percentageChange === null || currentValue === 0) {
    return 0
  }

  // Calculate the actual dollar change from the previous period to now
  // If percentageChange is positive, the previous value was: current_value / (1 + percentageChange/100)
  // The change is: current_value - previous_value
  const previousValue = currentValue / (1 + percentageChange / 100)
  const actualChange = currentValue - previousValue

  return actualChange
}
