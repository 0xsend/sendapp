import { cpus } from 'node:os'
import type { Database, Tables } from '@my/supabase/database.types'
import type { Logger } from 'pino'
import {
  createDistributionShares,
  fetchActiveDistributions,
  fetchAllHodlers,
  fetchAllVerifications,
  fetchDistribution,
  fetchDistributionShares,
  fetchSendSlash,
} from './supabase'
import { fetchAllBalances, isMerkleDropActive } from './wagmi'
import { calculateWeights, PERC_DENOM } from './weights'
import { assert } from 'app/utils/assert'

type Multiplier = {
  value?: number
  min: number
  max: number
  step: number
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const jsonBigint = (key, value) => {
  if (typeof value === 'bigint') {
    return value.toString()
  }
  return value
}

const getHoursInMonth = (date: Date) => {
  const year = date.getFullYear()
  const month = date.getMonth()
  const lastDay = new Date(year, month + 1, 0).getDate()
  return lastDay * 24
}

const getCurrentHourInMonth = (date: Date) => {
  return (date.getDate() - 1) * 24 + date.getHours()
}

/**
 * 100B supply -> 1B supply
 * 0 decimals -> 18 decimals
 * 1e18 / 100 = 1e16
 * v0Amount * 1e16
 * @param v0Amount
 * @returns converted v1Amount
 */
function sendV1Converstion(v0Amount: bigint) {
  return v0Amount * BigInt(1e16)
}

/**
 * The distribution number of the pre-sendv0 migration distribution
 */
const PRE_SENDV0_MIGRATION_DISTRIBUTION = 11

/**
 * Changes from V1:
 * Fixed Pool Calculation: In V2, fixed pool amounts are calculated first from the total distribution amount, whereas V1 calculated hodler, bonus, and fixed pools separately.
 * Removal of Bips: V2 no longer uses holder and bonus bips (basis points) for calculations, simplifying the distribution logic.
 * Bonus Shares Elimination: In V2, bonus shares are always 0, effectively removing the bonus pool concept that existed in V1.
 * Multiplier System: V2 introduces a new multiplier system, particularly for referrals and certain verification types
 * Send Slash System: V2 introduces a new system for handling send slashes, where non senders get slashed
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

    const { data: distributions, error } = await fetchActiveDistributions()

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
    distribution: NonNullable<Awaited<ReturnType<typeof fetchActiveDistributions>>['data']>[number]
  ): Promise<void> {
    const log = this.log.child({ distribution_id: distribution.id })

    assert(
      !!distribution.merkle_drop_addr && distribution.merkle_drop_addr !== null,
      'No merkle drop address found for distribution'
    )
    if (
      await isMerkleDropActive({
        tranche_id: distribution.tranche_id,
        chain_id: distribution.chain_id,
        merkle_drop_addr: distribution.merkle_drop_addr,
      })
    ) {
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
    // Filter out hodler with not enough send token balance
    const minBalanceAddresses: { user_id: string; address: `0x${string}`; balance: string }[] =
      await fetchAllBalances({
        addresses: hodlerAddresses,
        distribution,
      }).then(async (balances) => {
        log.info(`Found ${balances.length} balances.`)
        if (log.isLevelEnabled('debug')) {
          await Bun.write('dist/balances.json', JSON.stringify(balances, jsonBigint, 2)).catch(
            (e) => {
              log.error(e, 'Error writing balances.json')
            }
          )
        }

        return balances.filter(
          ({ balance }) => BigInt(balance) >= BigInt(distribution.hodler_min_balance)
        )
      })

    log.info(
      `Found ${minBalanceAddresses.length} balances after filtering ${hodlerAddresses.length} hodlers with hodler_min_balance of ${distribution.hodler_min_balance}`
    )

    if (log.isLevelEnabled('debug')) {
      await Bun.write(
        'dist/minBalanceAddresses.json',
        JSON.stringify(minBalanceAddresses, jsonBigint, 2)
      ).catch((e) => {
        log.error(e, 'Error writing balances.json')
      })
    }

    // Fetch send slash data
    const { data: sendSlash, error: sendSlashError } = await fetchSendSlash(distribution)

    if (sendSlashError) {
      throw sendSlashError
    }

    const { data: previousShares, error: previousSharesError } = await fetchDistributionShares(
      distribution.id - 1
    )
    if (previousSharesError) {
      throw previousSharesError
    }
    assert(previousShares !== null, 'No previous shares found')

    let scaledBalances = 0
    const previousSharesByUserId = previousShares.reduce(
      (acc, share) => {
        // NOTE: this is for handling the migration from send token v0 to send token v1
        // scale to new token decimals if needed after migration
        if (distribution.number === PRE_SENDV0_MIGRATION_DISTRIBUTION) {
          acc[share.user_id] = sendV1Converstion(BigInt(share.amount))
          scaledBalances++
          return acc
        }
        acc[share.user_id] = BigInt(share.amount)
        return acc
      },
      {} as Record<string, bigint>
    )

    log.debug(
      `Found ${
        Object.keys(previousSharesByUserId).length
      } previous shares and ${scaledBalances} scaled balances`
    )

    // Get send ceiling verifications
    const sendCeilingVerifications = verifications.filter((v) => v.type === 'send_ceiling')
    const sendCeilingByUserId = sendCeilingVerifications.reduce(
      (acc, v) => {
        const previousReward =
          previousSharesByUserId[v.user_id] || BigInt(distribution.hodler_min_balance)
        const maxWeight = previousReward / BigInt(sendSlash.scaling_divisor)
        const ceiling = {
          // Cap the weight to maxWeight
          weight: BigInt(v.weight || 0) > maxWeight ? maxWeight : BigInt(v.weight || 0),
          // @ts-expect-error @todo metadata is untyped but value is the convention
          ceiling: BigInt(v.metadata?.value || 0),
        }

        if (distribution.number === PRE_SENDV0_MIGRATION_DISTRIBUTION) {
          ceiling.weight = sendV1Converstion(ceiling.weight)
          ceiling.ceiling = sendV1Converstion(ceiling.ceiling)
        }

        acc[v.user_id] = ceiling
        return acc
      },
      {} as Record<string, { weight: bigint; ceiling: bigint }>
    )

    if (log.isLevelEnabled('debug')) {
      await Bun.write(
        'dist/sendCeilingByUserId.json',
        JSON.stringify(sendCeilingByUserId, jsonBigint, 2)
      ).catch((e) => {
        log.error(e, 'Error writing sendCeilingByUserId.json')
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

    let fixedPoolAllocatedAmount = 0n // This tracks slashed amount
    const fixedPoolAmountsByAddress: Record<string, bigint> = {}

    // Calculate fixed pool amounts
    for (const [userId, verifications] of Object.entries(verificationsByUserId)) {
      const hodler = hodlerAddressesByUserId[userId]
      if (!hodler || !hodler.address) continue
      const { address } = hodler
      if (!minBalanceByAddress[address]) continue

      let userFixedAmount = 0n
      const multipliers: Record<string, Multiplier> = {}

      // Calculate base fixed amount with multipliers
      for (const verification of verifications) {
        const verificationValue = verificationValues[verification.type]
        if (!verificationValue) continue

        if (
          !multipliers[verification.type] &&
          (verificationValue.multiplier_step > 0 || verificationValue.multiplier_max > 1)
        ) {
          multipliers[verification.type] = {
            value: undefined,
            min: verificationValue.multiplier_min,
            max: verificationValue.multiplier_max,
            step: verificationValue.multiplier_step,
          }
        }

        const multiplierInfo = multipliers[verification.type]
        const weight = verification.weight

        if (verificationValue.fixedValue) {
          userFixedAmount += verificationValue.fixedValue * BigInt(weight)
        }

        if (!multiplierInfo) continue

        // Apply multiplier logic
        if (weight === 1) {
          if (multiplierInfo.value === undefined) {
            multiplierInfo.value = multiplierInfo.min
          } else if (multiplierInfo.value < multiplierInfo.max) {
            multiplierInfo.value = Math.min(
              multiplierInfo.value + multiplierInfo.step,
              multiplierInfo.max
            )
          }
        } else {
          multiplierInfo.value = Math.min(
            multiplierInfo.min + (weight - 1) * multiplierInfo.step,
            multiplierInfo.max
          )
        }
      }

      const finalMultiplier = Object.values(multipliers).reduce(
        (acc, info) => acc * (info.value ?? 1.0),
        1.0
      )

      let amount =
        (userFixedAmount * BigInt(Math.round(finalMultiplier * Number(PERC_DENOM)))) / PERC_DENOM

      // Calculate slashed amount
      const sendCeilingData = sendCeilingByUserId[userId]
      const previousReward =
        previousSharesByUserId[userId] || BigInt(distribution.hodler_min_balance)

      if (sendCeilingData && sendCeilingData.weight > 0n) {
        const scaledPreviousReward = previousReward / BigInt(sendSlash.scaling_divisor)
        const cappedSendScore =
          sendCeilingData.weight > scaledPreviousReward
            ? scaledPreviousReward
            : sendCeilingData.weight
        if (scaledPreviousReward > 0n) {
          const slashPercentage = (cappedSendScore * PERC_DENOM) / scaledPreviousReward
          amount = (amount * slashPercentage) / PERC_DENOM
        } else {
          amount = 0n
        }
      } else {
        amount = 0n
      }

      if (fixedPoolAllocatedAmount + amount <= fixedPoolAvailableAmount) {
        fixedPoolAmountsByAddress[address] = amount
        fixedPoolAllocatedAmount += amount
      }
    }

    // Calculate hodler pool share weights
    const hodlerPoolAvailableAmount = distAmt - fixedPoolAllocatedAmount

    let hodlerShares: {
      address: string
      amount: bigint
    }[] = []

    if (hodlerPoolAvailableAmount > 0n) {
      const endDate = new Date(distribution.qualification_end)
      const currentDate = new Date() > endDate ? endDate : new Date()
      const hoursInMonth = getHoursInMonth(currentDate)
      const currentHour = getCurrentHourInMonth(currentDate)

      // Calculate time adjustment for slashed amounts
      const preciseHourlyHodlerPoolIncrement =
        (hodlerPoolAvailableAmount * PERC_DENOM) / BigInt(hoursInMonth)
      const preciseTimeSlashedHodlerPool =
        preciseHourlyHodlerPoolIncrement * BigInt(currentHour + 1) >
        hodlerPoolAvailableAmount * PERC_DENOM
          ? hodlerPoolAvailableAmount * PERC_DENOM
          : preciseHourlyHodlerPoolIncrement * BigInt(currentHour + 1)

      const hourlyHodlerPoolIncrement = preciseHourlyHodlerPoolIncrement / PERC_DENOM
      const timeSlashedHodlerPool = preciseTimeSlashedHodlerPool / PERC_DENOM

      // First calculate slashed balances for everyone
      const slashedBalances = minBalanceAddresses.map((balance) => {
        const userId = hodlerUserIdByAddress[balance.address] ?? ''
        const address = balance.address
        const sendCeilingData = sendCeilingByUserId[userId]
        let slashPercentage = 0n

        if (sendCeilingData && sendCeilingData.weight > 0n) {
          const previousReward =
            previousSharesByUserId[userId] || BigInt(distribution.hodler_min_balance)
          const preciseScaledPreviousReward =
            (previousReward * PERC_DENOM) / BigInt(sendSlash.scaling_divisor)
          const preciseWeight = sendCeilingData.weight * PERC_DENOM
          const preciseCappedWeight =
            preciseWeight > preciseScaledPreviousReward
              ? preciseScaledPreviousReward
              : preciseWeight
          slashPercentage = preciseCappedWeight / preciseScaledPreviousReward
        }

        const slashedBalance = ((BigInt(balance.balance) * slashPercentage) / PERC_DENOM).toString()

        return {
          address,
          balance: slashedBalance,
        }
      })

      if (log.isLevelEnabled('debug')) {
        await Bun.write(
          'dist/slashedBalances.json',
          JSON.stringify(slashedBalances, jsonBigint, 2)
        ).catch((e) => {
          log.error(e, 'Error writing slashedBalances.json')
        })
      }

      // Calculate weighted shares for current slashed state

      const weightedShares = calculateWeights(slashedBalances, timeSlashedHodlerPool)

      hodlerShares = slashedBalances.map((balance) => ({
        address: balance.address,
        amount: weightedShares[balance.address]?.amount || 0n,
      }))

      log.info(
        {
          hoursInMonth,
          currentHour,
          hourlyHodlerPoolIncrement,
          timeSlashedHodlerPool,
          fullAmount: hodlerPoolAvailableAmount,
        },
        'Time-based hodler pool calculations'
      )
    } else {
      log.warn('No hodler pool available amount')
    }

    // Track unslashed totals
    let totalAmount = 0n
    let totalHodlerPoolAmount = 0n
    const totalBonusPoolAmount = 0n
    let totalFixedPoolAmount = 0n

    // In the shares mapping section, update the map function:
    const shares = hodlerShares
      .map((share) => {
        const userId = hodlerUserIdByAddress[share.address]
        if (!userId) {
          log.debug({ share }, 'Hodler not found for address. Skipping share.')
          return null
        }

        //amount - ensure we always have a value
        const hodlerPoolAmount = share.amount || 0n
        const fixedPoolAmount = fixedPoolAmountsByAddress[share.address] || 0n
        const amount = hodlerPoolAmount + fixedPoolAmount

        // Skip if amount is 0
        if (amount <= 0n) {
          return null
        }

        // Update totals
        totalAmount += amount
        totalHodlerPoolAmount += hodlerPoolAmount
        totalFixedPoolAmount += fixedPoolAmount

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

    if (totalFixedPoolAmount > fixedPoolAvailableAmount) {
      log.warn(
        'Fixed pool amount is greater than available amount. This is not a problem, but it means the fixed pool is exhausted.'
      )
    }

    // Check total amounts against distribution amount
    const totalShareAmounts = shares.reduce((acc, share) => acc + BigInt(share.amount), 0n)
    if (totalShareAmounts > distAmt) {
      throw new Error('Share amounts exceed total distribution amount')
    }

    for (const share of shares) {
      if (!share.amount) {
        log.error({ share }, 'Share missing amount')
        throw new Error(`Share for user ${share.user_id} missing amount`)
      }
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
        const now = new Date()
        const nextHour = new Date(now)
        nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0)
        const targetTime = new Date(nextHour.getTime() - 60000) // 1 minute before next hour
        const waitTime = Math.max(0, targetTime.getTime() - now.getTime())

        process.env.NODE_ENV === 'development' ? await sleep(50_000) : await sleep(waitTime)
        await this.calculateDistributions()
      } catch (error) {
        this.log.error(error, `Error processing block. ${(error as Error).message}`)
      }
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
