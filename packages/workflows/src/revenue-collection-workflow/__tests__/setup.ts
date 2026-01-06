/**
 * Test setup for Anvil fork integration tests.
 *
 * Uses @morpho-org/test to spawn Anvil instances that fork Base mainnet.
 */
import { createViemTest } from '@morpho-org/test/vitest'
import { expect } from 'vitest'
import { base } from 'viem/chains'

// Fork URL - use env var or default to public Base RPC
const ANVIL_FORK_URL =
  process.env.ANVIL_FORK_URL || process.env.ANVIL_BASE_FORK_URL || 'https://mainnet.base.org'

/**
 * Extended Vitest test instance with Anvil fork client.
 *
 * Each test gets an isolated fork of Base mainnet at a specific block.
 * The client is a Viem test client with public actions extended.
 */
export const test = createViemTest(base, {
  forkUrl: ANVIL_FORK_URL,
  // Pin to a recent block for reproducibility
  // This should be updated periodically to test against recent state
  forkBlockNumber: 25_000_000n,
})

export { expect }

/**
 * Test addresses used in revenue collection tests.
 */
export const TEST_ADDRESSES = {
  // Revenue tokens
  MORPHO_TOKEN: '0xbaa5cc21fd487b8fcc2f632f3f4e8d37262a0842' as const,
  WELL_TOKEN: '0xA88594D404727625A9437C3f886C7643872296AE' as const,

  // Merkl distributor on Base
  MERKL_DISTRIBUTOR: '0x3Ef3D8bA38EBe18DB133cEc108f4D14CE00Dd9Ae' as const,

  // Send Foundation revenue safe
  REVENUE_SAFE: '0x65049C4B8e970F5bcCDAE8E141AA06346833CeC4' as const,

  // Test private key (anvil default account 0)
  // DO NOT use in production - this is a well-known test key
  TEST_PRIVATE_KEY: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80' as const,
}

/**
 * ERC20 minimal ABI for balance checks.
 */
export const ERC20_ABI = [
  {
    type: 'function',
    name: 'balanceOf',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'transfer',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
] as const

/**
 * SendEarn ABI subset for testing sweep functionality.
 */
export const SEND_EARN_ABI = [
  {
    type: 'function',
    name: 'collections',
    inputs: [],
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    name: 'collect',
    inputs: [{ name: 'token', type: 'address' }],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const
