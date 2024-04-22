import { cpus } from 'node:os'
import type { Database, Tables } from '@my/supabase/database.types'
import type { Logger } from 'pino'
import {
  createDistributionShares,
  fetchAllHodlers,
  fetchAllVerifications,
  fetchDistribution,
  supabaseAdmin,
} from './supabase'
import { fetchAllBalances } from './wagmi'
import { calculateWeights, calculatePercentageWithBips, PERC_DENOM } from './weights'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const cpuCount = cpus().length

const inBatches = <T>(array: T[], batchSize = Math.max(8, cpuCount - 1)) => {
  return Array.from({ length: Math.ceil(array.length / batchSize) }, (_, i) =>
    array.slice(i * batchSize, (i + 1) * batchSize)
  )
}

export class DistributorWorker {
  private log: Logger
  private running: boolean
  private id: string
  private lastDistributionId: number | null = null
  private workerPromise: Promise<void>

  constructor(log: Logger, start = true) {
    this.id = Math.random().toString(36).substring(7)
    this.log = log.child({ module: 'distributor', id: this.id })
    if (start) {
      this.running = true
      this.workerPromise = this.worker()
    } else {
      this.running = false
      this.workerPromise = Promise.resolve()
    }
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

    const {
      data: verifications,
      error: verificationsError,
      count,
    } = await fetchAllVerifications(distribution.id)

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

    const { data: hodlerAddresses, error: hodlerAddressesError } = await fetchAllHodlers(
      distribution.id
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
        fetchAllBalances({
          addresses,
          distribution,
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

    // for debugging
    const balancesByAddress: Record<string, bigint> = balances.reduce(
      (acc, balance) => {
        acc[balance.address] = BigInt(balance.balance)
        return acc
      },
      {} as Record<string, bigint>
    )

    if (log.isLevelEnabled('debug')) {
      await Bun.write(
        'balances.json',
        JSON.stringify(balances, (key, value) => {
          if (typeof value === 'bigint') {
            return value.toString()
          }
          return value
        })
      ).catch((e) => {
        log.error(e, 'Error writing balances.json')
      })
    }

    // Calculate hodler pool share weights
    const distAmt = BigInt(distribution.amount)
    const hodlerPoolBips = BigInt(distribution.hodler_pool_bips)
    const fixedPoolBips = BigInt(distribution.fixed_pool_bips)
    const bonusPoolBips = BigInt(distribution.bonus_pool_bips)
    const hodlerPoolAvailableAmount = calculatePercentageWithBips(distAmt, hodlerPoolBips)
    const { totalWeight, weightPerSend, poolWeights, weightedShares } = calculateWeights(
      balances,
      hodlerPoolAvailableAmount
    )

    log.info(
      { totalWeight, hodlerPoolAvailableAmount, weightPerSend },
      `Calculated ${Object.keys(poolWeights).length} weights.`
    )
    log.debug({ poolWeights })

    if (totalWeight === 0n) {
      log.warn('Total weight is 0. Skipping distribution.')
      return
    }

    const fixedPoolAvailableAmount = calculatePercentageWithBips(distAmt, fixedPoolBips)
    let fixedPoolAllocatedAmount = 0n
    const fixedPoolAmountsByAddress: Record<string, bigint> = {}
    const bonusPoolBipsByAddress: Record<string, bigint> = {}
    const maxBonusPoolBips = (bonusPoolBips * PERC_DENOM) / hodlerPoolBips // 3500*10000/6500 = 5384.615384615385% 1.53X

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

    const hodlerShares = Object.values(weightedShares)
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
        const amount = hodlerPoolAmount + bonusPoolAmount + fixedPoolAmount
        totalAmount += amount
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
            amount: amount,
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
          amount: amount.toString(),
          bonus_pool_amount: bonusPoolAmount.toString(),
          fixed_pool_amount: fixedPoolAmount.toString(),
          hodler_pool_amount: hodlerPoolAmount.toString(),
        } as Tables<'distribution_shares'>
      })
      .filter(Boolean) as Tables<'distribution_shares'>[]

    log.info(
      {
        totalAmount,
        totalHodlerPoolAmount,
        hodlerPoolAvailableAmount,
        totalBonusPoolAmount,
        totalFixedPoolAmount,
        fixedPoolAvailableAmount,
        maxBonusPoolBips,
        name: distribution.name,
        shares: shares.length,
      },
      'Distribution totals'
    )
    log.info(`Calculated ${shares.length} shares.`)
    log.debug({ shares })

    if (totalFixedPoolAmount > fixedPoolAvailableAmount) {
      log.warn(
        'Fixed pool amount is greater than available amount. This is not a problem, but it means the fixed pool is exhausted.'
      )
    }

    // ensure share amounts do not exceed the total distribution amount, ideally this should be done in the database
    const totalShareAmounts = shares.reduce((acc, share) => acc + BigInt(share.amount), 0n)
    if (totalShareAmounts > distAmt) {
      throw new Error('Share amounts exceed total distribution amount')
    }

    const { error } = await createDistributionShares(distribution.id, shares)
    if (error) {
      log.error({ error: error.message, code: error.code }, 'Error saving shares.')
      throw error
    }
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
    const { data: distribution, error } = await fetchDistribution(id)
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
