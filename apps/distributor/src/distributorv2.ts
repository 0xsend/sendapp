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
import { fetchAllBalances, isMerkleDropActive } from './wagmi'
import { calculateWeights, PERC_DENOM } from './weights'

type Multiplier = {
  value: number
  min: number
  max: number
  step: number
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const cpuCount = cpus().length

const inBatches = <T>(array: T[], batchSize = Math.max(8, cpuCount - 1)) => {
  return Array.from({ length: Math.ceil(array.length / batchSize) }, (_, i) =>
    array.slice(i * batchSize, (i + 1) * batchSize)
  )
}

const jsonBigint = (key, value) => {
  if (typeof value === 'bigint') {
    return value.toString()
  }
  return value
}

/**
 * Changes from V1:
 * Fixed Pool Calculation: In V2, fixed pool amounts are calculated first from the total distribution amount, whereas V1 calculated hodler, bonus, and fixed pools separately.
 * Removal of Bips: V2 no longer uses holder and bonus bips (basis points) for calculations, simplifying the distribution logic.
 * Bonus Shares Elimination: In V2, bonus shares are always 0, effectively removing the bonus pool concept that existed in V1.
 * Multiplier System: V2 introduces a new multiplier system, particularly for referrals and certain verification types
 */

export class DistributorV2Worker {
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
        distribution_verification_values (*)`,
        { count: 'exact' }
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

  private async _calculateDistributionShares(
    distribution: Tables<'distributions'> & {
      distribution_verification_values: Tables<'distribution_verification_values'>[]
    }
  ): Promise<void> {
    const log = this.log.child({ distribution_id: distribution.id })

    if (await isMerkleDropActive(distribution)) {
      throw new Error('Tranche is active. Cannot calculate distribution shares.')
    }

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
    if (log.isLevelEnabled('debug')) {
      await Bun.write(
        'dist/verifications.json',
        JSON.stringify(verifications, jsonBigint, 2)
      ).catch((e) => {
        log.error(e, 'Error writing verifications.json')
      })
    }

    const verificationValues = distribution.distribution_verification_values.reduce(
      (acc, verification) => {
        acc[verification.type] = {
          fixedValue: BigInt(verification.fixed_value),
          bipsValue: BigInt(verification.bips_value),
          multiplier_min: verification.multiplier_min,
          multiplier_max: verification.multiplier_max,
          multiplier_step: verification.multiplier_step,
        }
        return acc
      },
      {} as Record<
        Database['public']['Enums']['verification_type'],
        {
          fixedValue?: bigint
          bipsValue?: bigint
          multiplier_min: number
          multiplier_max: number
          multiplier_step: number
        }
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
    if (log.isLevelEnabled('debug')) {
      await Bun.write(
        'dist/verificationsByUserId.json',
        JSON.stringify(verificationsByUserId, jsonBigint, 2)
      ).catch((e) => {
        log.error(e, 'Error writing verificationsByUserId.json')
      })
    }

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
    if (log.isLevelEnabled('debug')) {
      await Bun.write(
        'dist/hodlerAddresses.json',
        JSON.stringify(hodlerAddresses, jsonBigint, 2)
      ).catch((e) => {
        log.error(e, 'Error writing hodlerAddresses.json')
      })
    }

    // lookup balances of all hodler addresses in qualification period
    const batches = inBatches(hodlerAddresses).flatMap(async (addresses) => {
      return await Promise.all(
        fetchAllBalances({
          addresses,
          distribution,
        })
      )
    })

    // Filter out hodler with not enough send token balance
    let minBalanceAddresses: { user_id: string; address: `0x${string}`; balance: string }[] = []
    for await (const batch of batches) {
      minBalanceAddresses = minBalanceAddresses.concat(...batch)
    }

    log.info(`Found ${minBalanceAddresses.length} balances.`)

    // Filter out hodler with not enough send token balance
    minBalanceAddresses = minBalanceAddresses.filter(
      ({ balance }) => BigInt(balance) >= BigInt(distribution.hodler_min_balance)
    )

    log.info(
      `Found ${minBalanceAddresses.length} balances after filtering hodler_min_balance of ${distribution.hodler_min_balance}`
    )

    if (log.isLevelEnabled('debug')) {
      await Bun.write(
        'dist/balances.json',
        JSON.stringify(minBalanceAddresses, jsonBigint, 2)
      ).catch((e) => {
        log.error(e, 'Error writing balances.json')
      })
    }

    // Calculate fixed pool share weights
    const distAmt = BigInt(distribution.amount)
    const fixedPoolAvailableAmount = distAmt

    const minBalanceByAddress: Record<string, bigint> = minBalanceAddresses.reduce(
      (acc, balance) => {
        acc[balance.address] = BigInt(balance.balance)
        return acc
      },
      {} as Record<string, bigint>
    )

    let fixedPoolAllocatedAmount = 0n
    const fixedPoolAmountsByAddress: Record<string, bigint> = {}

    for (const [userId, verifications] of Object.entries(verificationsByUserId)) {
      const hodler = hodlerAddressesByUserId[userId]
      if (!hodler || !hodler.address) continue
      const { address } = hodler
      if (!minBalanceByAddress[address]) continue

      let userFixedAmount = 0n
      let totalReferrals = 0
      const multipliers: Record<string, Multiplier> = {}

      for (const verification of verifications) {
        const verificationValue = verificationValues[verification.type]
        if (!verificationValue) continue

        // Calculate fixed amount
        if (verificationValue.fixedValue) {
          userFixedAmount += verificationValue.fixedValue
        }

        // Initialize or update multiplier info
        if (!multipliers[verification.type] && verificationValue.multiplier_min) {
          multipliers[verification.type] = {
            value: 1.0,
            min: verificationValue.multiplier_min,
            max: verificationValue.multiplier_max,
            step: verificationValue.multiplier_step,
          }
        }
        const multiplierInfo = multipliers[verification.type]
        if (!multiplierInfo) continue

        // Calculate multipliers
        switch (verification.type) {
          case 'total_tag_referrals': {
            // @ts-expect-error this is json
            totalReferrals = verification.metadata?.value ?? 0
            // Minus 1 from the count so 1 = multiplier min
            if (totalReferrals > 0n) {
              multiplierInfo.value = Math.min(
                multiplierInfo.min + (totalReferrals - 1) * multiplierInfo.step,
                multiplierInfo.max
              )
            } else {
              multiplierInfo.value = 0
            }

            break
          }
          case 'tag_referral': {
            multiplierInfo.value = Math.max(multiplierInfo.value, multiplierInfo.min)
            // Count tag_referral verifications
            const tagReferralCount = verifications.filter((v) => v.type === 'tag_referral').length
            // Increase multiplier for each additional tag_referral. Minus 1 from the count so 1 = multiplier min
            for (let i = 1; i < tagReferralCount; i++) {
              multiplierInfo.value = Math.min(
                multiplierInfo.min + (tagReferralCount - 1) * multiplierInfo.step,
                multiplierInfo.max
              )
            }
            break
          }
        }
      }

      // Calculate the final multiplier
      const finalMultiplier = Object.values(multipliers).reduce(
        (acc, info) => acc * info.value,
        1.0
      )

      // Apply the multiplier to the fixed amount
      userFixedAmount =
        (userFixedAmount * BigInt(Math.round(finalMultiplier * Number(PERC_DENOM)))) / PERC_DENOM

      if (
        userFixedAmount > 0n &&
        fixedPoolAllocatedAmount + userFixedAmount <= fixedPoolAvailableAmount
      ) {
        fixedPoolAmountsByAddress[address] =
          (fixedPoolAmountsByAddress[address] || 0n) + userFixedAmount
        fixedPoolAllocatedAmount += userFixedAmount

        // Log or save the multipliers for each verification type
        log.debug({ userId, address, multipliers, finalMultiplier }, 'User multipliers')
      }
    }

    // Calculate hodler pool share weights
    // -500 to account for rounding errors
    const hodlerPoolAvailableAmount = distAmt - fixedPoolAllocatedAmount - 500n

    let hodlerShares: { address: string; amount: bigint }[] = []
    if (hodlerPoolAvailableAmount > 0n) {
      const { weightedShares } = calculateWeights(minBalanceAddresses, hodlerPoolAvailableAmount)
      hodlerShares = Object.values(weightedShares)
    }

    let totalAmount = 0n
    let totalHodlerPoolAmount = 0n
    const totalBonusPoolAmount = 0n
    let totalFixedPoolAmount = 0n

    if (log.isLevelEnabled('debug')) {
      await Bun.write('dist/hodlerShares.json', JSON.stringify(hodlerShares, jsonBigint, 2)).catch(
        (e) => {
          log.error(e, 'Error writing hodlerShares.json')
        }
      )
      await Bun.write(
        'dist/fixedPoolAmountsByAddress.json',
        JSON.stringify(fixedPoolAmountsByAddress, jsonBigint, 2)
      ).catch((e) => {
        log.error(e, 'Error writing fixedPoolAmountsByAddress.json')
      })
    }

    const shares = hodlerShares
      .map((share) => {
        const userId = hodlerUserIdByAddress[share.address]
        const hodlerPoolAmount = share.amount
        const fixedPoolAmount = fixedPoolAmountsByAddress[share.address] || 0n
        const amount = hodlerPoolAmount + fixedPoolAmount
        totalAmount += amount
        totalHodlerPoolAmount += hodlerPoolAmount
        totalFixedPoolAmount += fixedPoolAmount

        if (!userId) {
          log.debug({ share }, 'Hodler not found for address. Skipping share.')
          return null
        }

        // log.debug(
        //   {
        //     address: share.address,
        //     balance: balancesByAddress[share.address],
        //     amount: amount,
        //     bonusBips,
        //     hodlerPoolAmount,
        //     bonusPoolAmount,
        //     fixedPoolAmount,
        //   },
        //   'Calculated share.'
        // )

        // @ts-expect-error supabase-js does not support bigint
        return {
          address: share.address,
          distribution_id: distribution.id,
          user_id: userId,
          amount: amount.toString(),
          fixed_pool_amount: fixedPoolAmount.toString(),
          hodler_pool_amount: hodlerPoolAmount.toString(),
          bonus_pool_amount: '0',
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
        fixedPoolAllocatedAmount,
        fixedPoolAvailableAmount,
        name: distribution.name,
        shares: shares.length,
      },
      'Distribution totals'
    )
    log.info(`Calculated ${shares.length} shares.`)
    if (log.isLevelEnabled('debug')) {
      await Bun.write('dist/shares.json', JSON.stringify(shares, jsonBigint, 2)).catch((e) => {
        log.error(e, 'Error writing shares.json')
      })
    }

    if (totalFixedPoolAmount > fixedPoolAvailableAmount) {
      log.warn(
        'Fixed pool amount is greater than available amount. This is not a problem, but it means the fixed pool is exhausted.'
      )
    }

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
      await sleep(60_000)
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
