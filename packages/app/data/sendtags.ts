import { formatUnits, parseUnits } from 'viem'

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
      return parseUnits('4', 6) // 4 USDC
    case 4:
      return parseUnits('8', 6) // 8 USDC
    case 3:
    case 2:
    case 1:
      return parseUnits('16', 6) // 16 USDC
    default:
      return parseUnits('2', 6) // 2 USDC for 6+ characters
  }
}

/**
 * Returns the referral reward for a Sendtag of the given length.
 * @param length The length of the Sendtag.
 * @returns The referral reward for the Sendtag.
 */
export function reward(length: number) {
  switch (length) {
    case 5:
      return parseUnits('3', 6) // 3 USDC
    case 4:
      return parseUnits('6', 6) // 6 USDC
    case 3:
    case 2:
    case 1:
      return parseUnits('12', 6) // 12 USDC
    default:
      return parseUnits('1.5', 6) // 1.5 USDC for 6+ characters
  }
}

/**
 * Returns the pricing information for Sendtags in USDC
 */
export const pricing = [
  {
    length: '6+ characters',
    price: formatUnits(price(6), 6),
  },
  {
    length: '5 characters',
    price: formatUnits(price(5), 6),
  },
  {
    length: '4 characters',
    price: formatUnits(price(4), 6),
  },
  {
    length: '1-3 characters',
    price: formatUnits(price(3), 6),
  },
]
