import { isAddressEqual, type Address } from 'viem'

/**
 * Hardcoded allowlist of addresses that should use the ERC-7677 bundler/paymaster
 */
const ERC7677_ADDRESS_ALLOWLIST = [
  '0x937Ac573608Af4E2F9f5ADc9ceF42b3c61681439',
  '0x5ab1d2bB1823A195c821b3B0d817e57d58BDA9f3',
] as const

/**
 * Determines if a given address should use the ERC-7677 bundler/paymaster flow.
 *
 * @param address - The sender address to check (optional)
 * @returns true if the address should use ERC-7677, false otherwise
 */
export function shouldUseErc7677(address: Address | undefined): boolean {
  // Return false if no address provided
  if (!address) {
    return false
  }

  // Always use Send bundler in development
  if (process.env.NODE_ENV === 'development') {
    return false
  }

  // Check if address is in allowlist
  return ERC7677_ADDRESS_ALLOWLIST.some((allowedAddr) =>
    isAddressEqual(address.toLowerCase() as Address, allowedAddr.toLowerCase() as Address)
  )
}
