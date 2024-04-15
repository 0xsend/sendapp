import { cpus } from 'node:os'
import type { Database, Tables } from '@my/supabase/database.types'
import { config, readSendTokenBalanceOf, type sendTokenAddress } from '@my/wagmi'
import { createClient } from '@supabase/supabase-js'
import { selectAll } from 'app/utils/supabase/selectAll'
import type { Logger } from 'pino'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error(
    'NEXT_PUBLIC_SUPABASE_URL is not set. Please update the root .env.local and restart the server.'
  )
}
if (!process.env.SUPABASE_SERVICE_ROLE) {
  throw new Error(
    'SUPABASE_SERVICE_ROLE is not set. Please update the root .env.local and restart the server.'
  )
}

/**
 * only meant to be used on the server side.
 */
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE,
  { auth: { persistSession: false } }
)

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const cpuCount = cpus().length

const inBatches = <T>(array: T[], batchSize = Math.max(8, cpuCount - 1)) => {
  return Array.from({ length: Math.ceil(array.length / batchSize) }, (_, i) =>
    array.slice(i * batchSize, (i + 1) * batchSize)
  )
}

function calculatePercentageWithBips(value: bigint, bips: bigint) {
  const bps = bips * 10000n
  const percentage = value * (bps / 10000n)
  return percentage / 10000n
}

export class DistributorWorker {
  private log: Logger
  private running: boolean
  private id: string
  private lastDistributionId: number | null = null
  private workerPromise: Promise<void>

  constructor(log: Logger) {
    this.id = Math.random().toString(36).substring(7)
    this.log = log.child({ module: 'distributor', id: this.id })
    this.running = true
    this.workerPromise = this.worker()
  }

  /**
   * Calculates distribution shares for distributions in qualification period.
   */
  private async calculateDistributions() {
    this.log.info('Calculating distributions')

    const { data: distributions, error } = await supabaseAdmin
      .from('distributions')
      .select(
        `*,
        distribution_verification_values (*)`
      )
      .lte('qualification_start', new Date().toISOString())
      .gte('qualification_end', new Date().toISOString())

    if (error) {
      this.log.error({ error: error.message, code: error.code }, 'Error fetching distributions.')
      throw error
    }

    this.log.debug({ distributions }, `Found ${distributions.length} distributions.`)

    if (distributions.length === 0) {
      this.log.info('No distributions found.')
      return
    }

    if (distributions.length > 1) {
      this.log.error(`Found ${distributions.length} distributions. Only one is supported.`)
      return
    }

    const errors: unknown[] = []

    for (const distribution of distributions) {
      await this._calculateDistributionShares(distribution).catch((error) => errors.push(error))
    }

    if (distributions.length > 0) {
      const lastDistribution = distributions[distributions.length - 1]
      this.lastDistributionId = lastDistribution?.id ?? null
    } else {
      this.lastDistributionId = null
    }
    this.log.info(
      { lastDistributionId: this.lastDistributionId },
      'Finished calculating distributions.'
    )

    if (errors.length > 0) {
      this.log.error(`Error calculating distribution shares. Encountered ${errors.length} errors.`)
      throw errors[0]
    }
  }

  /**
   * Calculates distribution shares for a single distribution.
   */
  private async _calculateDistributionShares(
    distribution: Tables<'distributions'> & {
      distribution_verification_values: Tables<'distribution_verification_values'>[]
    }
  ): Promise<void> {
    const log = this.log.child({ distribution_id: distribution.id })
    log.info({ distribution_id: distribution.id }, 'Calculating distribution shares.')

    // fetch all verifications
    const {
      data: verifications,
      error: verificationsError,
      count,
    } = await selectAll(
      supabaseAdmin
        .from('distribution_verifications')
        .select('*', { count: 'exact' })
        .eq('distribution_id', distribution.id)
    )

    if (verificationsError) {
      throw verificationsError
    }

    if (verifications === null || verifications.length === 0) {
      log.warn('No verifications found. Skipping distribution.')
      return
    }

    if (count !== verifications.length) {
      throw new Error('Verifications count does not match expected count')
    }

    log.info(`Found ${verifications.length} verifications.`)
    log.debug({ verifications })

    const verificationValues = distribution.distribution_verification_values.reduce(
      (acc, verification) => {
        acc[verification.type] = {
          fixedValue: BigInt(verification.fixed_value),
          bipsValue: BigInt(verification.bips_value),
        }
        return acc
      },
      {} as Record<
        Database['public']['Enums']['verification_type'],
        { fixedValue?: bigint; bipsValue?: bigint }
      >
    )
    const verificationsByUserId = verifications.reduce(
      (acc, verification) => {
        acc[verification.user_id] = acc[verification.user_id] || []
        acc[verification.user_id]?.push(verification)
        return acc
      },
      {} as Record<string, Database['public']['Tables']['distribution_verifications']['Row'][]>
    )

    log.info(`Found ${Object.keys(verificationsByUserId).length} users with verifications.`)
    log.debug({ verificationsByUserId })

    const { data: hodlerAddresses, error: hodlerAddressesError } = await selectAll(
      supabaseAdmin
        .rpc(
          'distribution_hodler_addresses',
          {
            distribution_id: distribution.id,
          },
          { count: 'exact' }
        )
        .select('*')
    )
    if (hodlerAddressesError) {
      throw hodlerAddressesError
    }

    if (hodlerAddresses === null || hodlerAddresses.length === 0) {
      throw new Error('No hodler addresses found')
    }

    const hodlerAddressesByUserId = hodlerAddresses.reduce(
      (acc, address) => {
        acc[address.user_id] = address
        return acc
      },
      {} as Record<string, Database['public']['Tables']['chain_addresses']['Row']>
    )
    const hodlerUserIdByAddress = hodlerAddresses.reduce(
      (acc, address) => {
        acc[address.address] = address.user_id
        return acc
      },
      {} as Record<string, string>
    )

    log.info(`Found ${hodlerAddresses.length} addresses.`)
    log.debug({ hodlerAddresses })

    // lookup balances of all hodler addresses in qualification period
    const batches = inBatches(hodlerAddresses).flatMap(async (addresses) => {
      return await Promise.all(
        addresses.map(async ({ user_id, address }) => {
          const balance = await readSendTokenBalanceOf(config, {
            args: [address],
            chainId: distribution.chain_id as keyof typeof sendTokenAddress,
            blockNumber: distribution.snapshot_block_num
              ? BigInt(distribution.snapshot_block_num)
              : undefined,
          })
          return {
            user_id,
            address,
            balance: balance.toString(),
          }
        })
      )
    })

    let balances: { user_id: string; address: `0x${string}`; balance: string }[] = []
    for await (const batch of batches) {
      balances = balances.concat(...batch)
    }

    log.info(`Found ${balances.length} balances.`)
    log.debug({ balances })

    // Filter out hodler with not enough send token balance
    balances = balances.filter(
      ({ balance }) => BigInt(balance) >= BigInt(distribution.hodler_min_balance)
    )

    log.info(
      `Found ${balances.length} balances after filtering hodler_min_balance of ${distribution.hodler_min_balance}`
    )
    log.debug({ balances })

    // Calculate hodler pool share weights
    const amount = BigInt(distribution.amount)
    const hodlerPoolBips = BigInt(distribution.hodler_pool_bips)
    const fixedPoolBips = BigInt(distribution.fixed_pool_bips)
    const bonusPoolBips = BigInt(distribution.bonus_pool_bips)
    const poolWeights: Record<string, bigint> = {}
    const balancesByAddress: Record<string, bigint> = {}
    for (const { address, balance } of balances) {
      const weight = BigInt(balance)
      if (poolWeights[address] === undefined) {
        poolWeights[address] = 0n
      }
      poolWeights[address] += weight
      balancesByAddress[address] = weight
    }

    // Calculate hodler pool share amounts
    const totalWeight = Object.values(poolWeights).reduce((acc, weight) => acc + weight, 0n)
    const hodlerPoolAvailableAmount = calculatePercentageWithBips(amount, hodlerPoolBips)
    const weightPerSend = (totalWeight * 10000n) / hodlerPoolAvailableAmount

    log.info(
      { totalWeight, hodlerPoolAvailableAmount, weightPerSend },
      `Calculated ${Object.keys(poolWeights).length} weights.`
    )
    log.debug({ poolWeights })

    if (totalWeight === 0n) {
      log.warn('Total weight is 0. Skipping distribution.')
      return
    }

    const sharesObj: Record<string, { address: string; amount: bigint }> = {}
    for (const [address, weight] of Object.entries(poolWeights)) {
      const amount = (weight * 10000n) / weightPerSend
      if (amount > 0n) {
        sharesObj[address] = {
          amount,
          address,
        }
      }
    }

    const fixedPoolAvailableAmount = calculatePercentageWithBips(amount, fixedPoolBips)
    let fixedPoolAllocatedAmount = 0n
    const fixedPoolAmountsByAddress: Record<string, bigint> = {}
    const bonusPoolBipsByAddress: Record<string, bigint> = {}
    const maxBonusPoolBips = (bonusPoolBips * 10000n) / hodlerPoolBips // 3500*10000/6500 = 5384.615384615385% 1.53X

    for (const [userId, verifications] of Object.entries(verificationsByUserId)) {
      const hodler = hodlerAddressesByUserId[userId]
      if (!hodler || !hodler.address) {
        log.debug({ userId }, 'Hodler not found for user Skipping verification.')
        continue
      }
      const { address } = hodler
      for (const verification of verifications) {
        const { fixedValue, bipsValue } = verificationValues[verification.type]
        if (fixedValue && fixedPoolAllocatedAmount + fixedValue <= fixedPoolAvailableAmount) {
          if (fixedPoolAmountsByAddress[address] === undefined) {
            fixedPoolAmountsByAddress[address] = 0n
          }
          fixedPoolAmountsByAddress[address] += fixedValue
          fixedPoolAllocatedAmount += fixedValue
        }
        if (bipsValue) {
          bonusPoolBipsByAddress[address] = (bonusPoolBipsByAddress[address] || 0n) as bigint
          bonusPoolBipsByAddress[address] += bipsValue
          bonusPoolBipsByAddress[address] =
            (bonusPoolBipsByAddress[address] as bigint) > maxBonusPoolBips
              ? maxBonusPoolBips
              : (bonusPoolBipsByAddress[address] as bigint) // cap at max bonus pool bips
        }
      }
    }

    const hodlerShares = Object.values(sharesObj)
    let totalAmount = 0n
    let totalHodlerPoolAmount = 0n
    let totalBonusPoolAmount = 0n
    let totalFixedPoolAmount = 0n

    log.info(
      {
        maxBonusPoolBips,
      },
      'Calculated fixed & bonus pool amounts.'
    )
    log.debug({ hodlerShares, fixedPoolAmountsByAddress, bonusPoolBipsByAddress })

    const shares = hodlerShares
      .map((share) => {
        const userId = hodlerUserIdByAddress[share.address]
        const bonusBips = bonusPoolBipsByAddress[share.address] || 0n
        const hodlerPoolAmount = share.amount
        const bonusPoolAmount = calculatePercentageWithBips(hodlerPoolAmount, bonusBips)
        const fixedPoolAmount = fixedPoolAmountsByAddress[share.address] || 0n
        totalAmount += hodlerPoolAmount + bonusPoolAmount + fixedPoolAmount
        totalHodlerPoolAmount += hodlerPoolAmount
        totalBonusPoolAmount += bonusPoolAmount
        totalFixedPoolAmount += fixedPoolAmount

        if (!userId) {
          log.debug({ share }, 'Hodler not found for address. Skipping share.')
          return null
        }

        log.debug(
          {
            address: share.address,
            balance: balancesByAddress[share.address],
            amount: hodlerPoolAmount + bonusPoolAmount,
            bonusBips,
            hodlerPoolAmount,
            bonusPoolAmount,
            fixedPoolAmount,
          },
          'Calculated share.'
        )
        // @ts-expect-error supabase-js does not support bigint
        return {
          address: share.address,
          distribution_id: distribution.id,
          user_id: userId,
          amount: (hodlerPoolAmount + bonusPoolAmount).toString(),
          bonus_pool_amount: bonusPoolAmount.toString(),
          fixed_pool_amount: fixedPoolAmount.toString(),
          hodler_pool_amount: hodlerPoolAmount.toString(),
        } as Tables<'distribution_shares'>
      })
      .filter(Boolean)

    log.info(
      {
        totalAmount,
        totalHodlerPoolAmount,
        totalBonusPoolAmount,
        totalFixedPoolAmount,
        maxBonusPoolBips,
        name: distribution.name,
        shares: shares.length,
      },
      'Distribution totals'
    )
    log.info(`Calculated ${shares.length} shares.`)
    log.debug({ shares })
    const { error } = await supabaseAdmin.rpc('update_distribution_shares', {
      distribution_id: distribution.id,
      shares,
    })
    if (error) {
      log.error({ error: error.message, code: error.code }, 'Error saving shares.')
      throw error
    }
    return shares
  }

  private async worker() {
    this.log.info('Starting distributor...', { id: this.id })

    while (this.running) {
      try {
        await this.calculateDistributions()
      } catch (error) {
        this.log.error(error, `Error processing block. ${(error as Error).message}`)
      }
      await sleep(60_000) // sleep for 1 minute
    }

    this.log.info('Distributor stopped.')
  }

  public async stop() {
    this.log.info('Stopping distributor...')
    this.running = false
    return await this.workerPromise
  }

  public async calculateDistribution(id: string) {
    const { data: distribution, error } = await supabaseAdmin
      .from('distributions')
      .select(
        `*,
        distribution_verification_values (*)`
      )
      .eq('id', id)
      .single()
    if (error) {
      this.log.error({ error: error.message, code: error.code }, 'Error fetching distribution.')
      throw error
    }
    try {
      return this._calculateDistributionShares(distribution)
    } catch (error) {
      this.log.error(error, 'Error calculating distribution.')
      throw error
    }
  }

  public toJSON() {
    return {
      id: this.id,
      running: this.running,
      lastDistributionId: this.lastDistributionId,
    }
  }
}
