/**
 * Floors a number to a specified precision.
 * @param num - The number to be floored.
 * @param precision - The number of decimal places (positive value) or significant figures (negative value) to floor to.
 * @returns - The number floored to the desired precision.
 */
export function floor(num: number, precision = 0): number {
  const factor = Math.pow(10, precision)
  if (precision < 0) {
    // For negative precision, get the absolute value of the precision.
    const absolutePrecision = Math.abs(precision)

    // Calculate a rounding factor that is 10 to the power of the absolute precision.
    const roundingFactor = Math.pow(10, absolutePrecision)

    // Divide the number by the rounding factor, floor it, then multiply it back.
    return Math.floor(num / roundingFactor) * roundingFactor
  }
  // For positive precision (or precision of 0), round as we discussed before.
  return Math.floor(num * factor) / factor
}
