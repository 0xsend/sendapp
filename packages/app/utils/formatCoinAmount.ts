import { formatUnits } from 'viem'
import formatAmount from './formatAmount'
import type { coin } from 'app/data/coins'

/**
 * Formats an amount of a coin to a human readable string using the coin decimals.
 *
 * @param amount - The amount to format
 * @param coin - The coin to format the amount for
 * @returns The formatted amount
 */
export function formatCoinAmount({ amount, coin }: { amount: bigint; coin: coin }) {
  return formatAmount(formatUnits(amount, coin.decimals), undefined, coin.formatDecimals)
}
