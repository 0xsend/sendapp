/**
 * Canton Wallet Priority Token Eligibility Service
 *
 * This service validates user eligibility for Canton Wallet priority tokens.
 * Eligibility is determined by three server-side checks at a snapshot block:
 * 1. SendTag ownership (via distribution_verifications)
 * 2. Send Earn balance >= $2,000 USDC (via send_earn_balances_timeline at snapshot block)
 * 3. SEND token balance >= 3,000 SEND (via RPC call at snapshot block)
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { PublicClient, Abi } from 'viem'
import debugBase from 'debug'
import { hexToBytea } from 'app/utils/hexToBytea'
import { byteaToHex } from 'app/utils/byteaToHex'
import type { EligibilityResult, EligibilityCheck } from './types'
import { CANTON_SNAPSHOT_CONFIG } from './types'

const debug = debugBase('api:canton:eligibility')

/**
 * SEND Token Contract Configuration
 * Base Mainnet (chain ID 8453)
 */
const SEND_TOKEN_CONFIG = {
  address: '0x3f14920c99BEB920Afa163031c4e47a3e03B3e4A' as `0x${string}`,
  chainId: 8453,
  abi: [
    {
      type: 'function',
      name: 'balanceOf',
      stateMutability: 'view',
      inputs: [{ name: 'account', type: 'address' }],
      outputs: [{ type: 'uint256' }],
    },
  ] as const satisfies Abi,
} as const

/**
 * In-memory cache for eligibility results
 * Key: userId, Value: { result, expiresAt }
 */
interface CacheEntry {
  result: EligibilityResult
  expiresAt: number
}

const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour

/**
 * Validates UUID format (basic check)
 */
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

/**
 * Canton Wallet Priority Token Eligibility Service
 */
export class CantonEligibilityService {
  private cache = new Map<string, CacheEntry>()

  constructor(
    private readonly supabase: SupabaseClient,
    private readonly viemClient: PublicClient
  ) {
    if (!supabase) {
      throw new Error('Supabase client is required')
    }
    if (!viemClient) {
      throw new Error('Viem client is required')
    }
  }

  /**
   * Check if user is eligible for Canton Wallet priority tokens
   *
   * @param userId - User's UUID from Supabase auth
   * @returns Eligibility result with detailed check information
   * @throws Error if userId is invalid or database queries fail
   */
  async checkEligibility(userId: string): Promise<EligibilityResult> {
    debug('Checking eligibility for user: %s', userId)

    // Validate userId
    if (!userId || userId.trim() === '') {
      throw new Error('User ID is required')
    }
    if (!isValidUUID(userId)) {
      throw new Error('Invalid user ID format')
    }

    // Check cache first
    const cached = this.cache.get(userId)
    if (cached && cached.expiresAt > Date.now()) {
      debug('Returning cached result for user: %s', userId)
      return cached.result
    }

    // Get active distribution
    const distribution = await this.getActiveDistribution()
    if (!distribution) {
      throw new Error('No active distribution found')
    }

    // Determine snapshot block number
    // For distributions without snapshot_block_num (test/dev), use current block
    let snapshotBlock: bigint
    if (!distribution.snapshot_block_num) {
      debug(
        'Distribution %s has no snapshot_block_num, fetching current block from RPC',
        distribution.name
      )
      snapshotBlock = await this.viemClient.getBlockNumber()
      debug('Using current block: %s', snapshotBlock)
    } else {
      snapshotBlock = BigInt(distribution.snapshot_block_num)
      debug('Using distribution snapshot block: %s', snapshotBlock)
    }

    debug('Checking eligibility for distribution: %s (block: %s)', distribution.name, snapshotBlock)

    // Run all three checks in parallel
    const [hasTag, hasEarnBalance, hasSendBalance] = await Promise.all([
      this.checkSendTagOwnership(userId, distribution.id),
      this.checkSendEarnBalance(userId, snapshotBlock),
      this.checkSendTokenBalance(userId, snapshotBlock, distribution.token_addr),
    ])

    // User is eligible if ALL checks pass
    const eligible = hasTag.eligible && hasEarnBalance.eligible && hasSendBalance.eligible

    const result: EligibilityResult = {
      eligible,
      checkedAt: new Date().toISOString(),
      checks: {
        hasTag,
        hasEarnBalance,
        hasSendBalance,
      },
      distribution: {
        id: distribution.id,
        number: distribution.number,
        name: distribution.name,
        snapshot_block_num: snapshotBlock.toString(),
      },
    }

    // Cache the result
    this.cache.set(userId, {
      result,
      expiresAt: Date.now() + CACHE_TTL_MS,
    })

    debug(
      'Eligibility check complete for user %s: %s',
      userId,
      eligible ? 'ELIGIBLE' : 'NOT ELIGIBLE'
    )

    return result
  }

  /**
   * Clear the eligibility cache
   */
  clearCache(): void {
    debug('Clearing eligibility cache')
    this.cache.clear()
  }

  /**
   * Get the latest active distribution
   * Filters by qualification dates to match frontend logic
   */
  private async getActiveDistribution(): Promise<{
    id: number
    number: number
    name: string
    snapshot_block_num: string
    chain_id: number
    token_addr: `\\x${string}`
  } | null> {
    const now = new Date().toISOString()

    const { data, error } = await this.supabase
      .from('distributions')
      .select('id, number, name, snapshot_block_num, chain_id, token_addr')
      .lte('qualification_start', now)
      .gte('qualification_end', now)
      .order('number', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      debug('Error fetching distribution: %o', error)
      throw new Error(error.message)
    }

    return data
  }

  /**
   * Check if user has a registered SendTag with weight > 0
   */
  private async checkSendTagOwnership(
    userId: string,
    distributionId: number
  ): Promise<EligibilityCheck> {
    debug('Checking SendTag ownership for user: %s', userId)

    const { data, error } = await this.supabase
      .from('distribution_verifications')
      .select('weight')
      .eq('user_id', userId)
      .eq('distribution_id', distributionId)
      .eq('type', 'tag_registration')
      .gt('weight', 0)
      .maybeSingle()

    if (error) {
      debug('Error checking tag ownership: %o', error)
      throw new Error(`Failed to check SendTag ownership: ${error.message}`)
    }

    const hasTag = data !== null

    return {
      eligible: hasTag,
      reason: hasTag ? 'User has registered SendTag' : 'No SendTag registered',
      metadata: hasTag
        ? {
            weight: data.weight,
          }
        : undefined,
    }
  }

  /**
   * Check if user has Send Earn balance >= $2,000 USDC at snapshot block
   */
  private async checkSendEarnBalance(
    userId: string,
    snapshotBlock: bigint
  ): Promise<EligibilityCheck> {
    debug('Checking Send Earn balance for user: %s at block: %s', userId, snapshotBlock)

    // First, get the user's send account address
    const { data: sendAccount, error: accountError } = await this.supabase
      .from('send_accounts')
      .select('address')
      .eq('user_id', userId)
      .maybeSingle()

    if (accountError) {
      debug('Error fetching send account: %o', accountError)
      throw new Error(`Failed to fetch send account: ${accountError.message}`)
    }

    if (!sendAccount) {
      return {
        eligible: false,
        reason: 'No Send account found for user',
        metadata: {
          actualBalance: '0',
          requiredBalance: CANTON_SNAPSHOT_CONFIG.MIN_EARN_BALANCE_USDC.toString(),
        },
      }
    }

    const address = sendAccount.address
    if (typeof address !== 'string' || !address.startsWith('0x')) {
      throw new Error(`Invalid send account address for user: ${userId}`)
    }
    const ownerBytea = hexToBytea(address as `0x${string}`)

    // Query send_earn_balances_timeline for all vaults at or before snapshot block
    // The view returns cumulative balances over time, grouped by vault (log_addr)
    // We need the most recent balance for each vault <= snapshot block
    const { data: balances, error: balancesError } = await this.supabase
      .from('send_earn_balances_timeline')
      .select('log_addr, assets')
      .eq('owner', ownerBytea)
      .lte('block_num', snapshotBlock.toString())
      .order('block_num', { ascending: false })

    if (balancesError) {
      debug('Error fetching earn balances: %o', balancesError)
      throw new Error(`Failed to fetch Send Earn balances: ${balancesError.message}`)
    }

    // Deduplicate by vault (log_addr) - take most recent balance for each vault
    const vaultBalances = new Map<string, bigint>()
    for (const balance of balances || []) {
      // log_addr is bytea format: \xHEX
      const vaultKey =
        typeof balance.log_addr === 'string' ? balance.log_addr : balance.log_addr.toString()
      if (!vaultBalances.has(vaultKey)) {
        vaultBalances.set(vaultKey, BigInt(balance.assets || 0))
      }
    }

    // Sum all vault balances
    const totalBalance = Array.from(vaultBalances.values()).reduce(
      (sum, amount) => sum + amount,
      0n
    )

    const meetsThreshold = totalBalance >= CANTON_SNAPSHOT_CONFIG.MIN_EARN_BALANCE_USDC

    return {
      eligible: meetsThreshold,
      reason: meetsThreshold
        ? 'Send Earn balance meets minimum requirement'
        : 'Send Earn balance below minimum requirement',
      metadata: {
        actualBalance: totalBalance.toString(),
        requiredBalance: CANTON_SNAPSHOT_CONFIG.MIN_EARN_BALANCE_USDC.toString(),
        vaultCount: vaultBalances.size,
      },
    }
  }

  /**
   * Check if user has SEND token balance >= 3,000 SEND at snapshot block
   */
  private async checkSendTokenBalance(
    userId: string,
    snapshotBlock: bigint,
    tokenAddr: `\\x${string}`
  ): Promise<EligibilityCheck> {
    debug('Checking SEND token balance for user: %s at block: %s', userId, snapshotBlock)

    // Get user's send account address
    const { data: sendAccount, error: accountError } = await this.supabase
      .from('send_accounts')
      .select('address')
      .eq('user_id', userId)
      .maybeSingle()

    if (accountError) {
      debug('Error fetching send account: %o', accountError)
      throw new Error(`Failed to fetch send account: ${accountError.message}`)
    }

    if (!sendAccount) {
      return {
        eligible: false,
        reason: 'No Send account found for user',
        metadata: {
          actualBalance: '0',
          requiredBalance: CANTON_SNAPSHOT_CONFIG.MIN_SEND_BALANCE.toString(),
        },
      }
    }

    // Convert bytea token address to hex
    const tokenAddress = byteaToHex(tokenAddr)
    debug('Using token address: %s', tokenAddress)

    // Query SEND token balance at snapshot block via RPC
    const balance = await this.viemClient.readContract({
      address: tokenAddress,
      abi: SEND_TOKEN_CONFIG.abi,
      functionName: 'balanceOf',
      args: [sendAccount.address as `0x${string}`],
      blockNumber: snapshotBlock,
    })

    const meetsThreshold = balance >= CANTON_SNAPSHOT_CONFIG.MIN_SEND_BALANCE

    return {
      eligible: meetsThreshold,
      reason: meetsThreshold
        ? 'SEND token balance meets minimum requirement'
        : 'SEND token balance below minimum requirement',
      metadata: {
        actualBalance: balance.toString(),
        requiredBalance: CANTON_SNAPSHOT_CONFIG.MIN_SEND_BALANCE.toString(),
      },
    }
  }
}
