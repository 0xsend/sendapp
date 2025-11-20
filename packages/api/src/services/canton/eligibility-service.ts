/**
 * Canton Wallet Priority Token Eligibility Service
 *
 * This service validates user eligibility for Canton Wallet priority tokens.
 * Eligibility is determined server-side at a snapshot block:
 * - SEND token balance >= 3,000 SEND (via RPC call at snapshot block)
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { PublicClient, Abi } from 'viem'
import debugBase from 'debug'
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

    const hasSendBalance = await this.checkSendTokenBalance(
      userId,
      snapshotBlock,
      distribution.token_addr
    )

    // User is eligible if SEND balance check passes
    const eligible = hasSendBalance.eligible

    const result: EligibilityResult = {
      eligible,
      checkedAt: new Date().toISOString(),
      checks: {
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
