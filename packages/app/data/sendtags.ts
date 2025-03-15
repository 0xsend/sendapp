import { formatUnits, parseUnits } from 'viem'
import { usdcCoin } from 'app/data/coins'

export const maxNumSendTags = 5

/**
 * Returns the total price of all pending Sendtags.
 * @param pendingTags The pending Sendtags.
 * @returns The total price of all pending Sendtags.
 */
export function total(pendingTags: { name: string }[]) {
  return pendingTags.reduce((acc, { name }) => acc + price(name.length), BigInt(0))
}

/**
 * Returns the price of a Sendtag of the given length.
 * @param length The length of the Sendtag.
 * @returns The price of the Sendtag.
 */
export function price(length: number) {
  switch (length) {
    case 5:
      return parseUnits('4', usdcCoin.decimals) // 4 USDC
    case 4:
      return parseUnits('8', usdcCoin.decimals) // 8 USDC
    case 3:
    case 2:
    case 1:
      return parseUnits('16', usdcCoin.decimals) // 16 USDC
    default:
      return parseUnits('2', usdcCoin.decimals) // 2 USDC for 6+ characters
  }
}

/**
 * Returns the referral reward for a Sendtag of the given length.
 * The reward is 25% of the sendtag price.
 *
 * @param length The length of the Sendtag.
 * @returns The referral reward for the Sendtag.
 */
export function reward(length: number) {
  switch (length) {
    case 5:
      return parseUnits('1', usdcCoin.decimals) // 1 USDC
    case 4:
      return parseUnits('2', usdcCoin.decimals) // 8 USDC
    case 3:
    case 2:
    case 1:
      return parseUnits('4', usdcCoin.decimals) // 4 USDC
    default:
      return parseUnits('.5', usdcCoin.decimals) // .50 USDC for 6+ characters
  }
}

/**
 * Returns the pricing information for Sendtags in USDC
 */
export const pricing = [
  {
    length: '6+ characters',
    price: formatUnits(price(6), usdcCoin.decimals),
  },
  {
    length: '5 characters',
    price: formatUnits(price(5), usdcCoin.decimals),
  },
  {
    length: '4 characters',
    price: formatUnits(price(4), usdcCoin.decimals),
  },
  {
    length: '1-3 characters',
    price: formatUnits(price(3), usdcCoin.decimals),
  },
]
