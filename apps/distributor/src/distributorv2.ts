import type { Database, Tables, Views } from '@my/supabase/database.types'
import type { Logger } from 'pino'
import {
  createDistributionShares,
  fetchActiveDistributions,
  fetchAllEarnBalancesTimeline,
  fetchAllHodlers,
  fetchAllVerifications,
  fetchDistribution,
  fetchDistributionShares,
  fetchSendScores,
  fetchSendSlash,
  updateReferralVerifications,
} from './supabase'
import { fetchAllBalances, isMerkleDropActive } from './wagmi'
import { calculateWeights, Mode, PERC_DENOM } from './weights'
import {
  calculateMultiplier,
  calculateCombinedMultiplier,
  calculateSlashPercentage,
  type Multiplier,
} from './fixed-pool-calculation'
import { assert } from 'app/utils/assert'
import { byteaToHex } from 'app/utils/byteaToHex'
import type { Address } from 'viem'
import { COST_PER_TICKET_WEI } from 'packages/app/data/sendpot'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const jsonBigint = (key, value) => {
  if (typeof value === 'bigint') {
    return value.toString()
  }
  return value
}

const getHoursInMonth = (date: Date) => {
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth()
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  return lastDay * 24
}

const getCurrentHourInMonth = (date: Date) => {
  return (date.getUTCDate() - 1) * 24 + date.getUTCHours()
}

const normalizeAddress = (address: string): Address => address.toLowerCase() as Address

/**
 * Changes from V1:
 * Fixed Pool Calculation: In V2, fixed pool amounts are calculated first from the total distribution amount, whereas V1 calculated hodler, bonus, and fixed pools separately.
 * Removal of Bips: V2 no longer uses holder and bonus bips (basis points) for calculations, simplifying the distribution logic.
 * Bonus Shares Elimination: In V2, bonus shares are always 0, effectively removing the bonus pool concept that existed in V1.
 * Multiplier System: V2 introduces a new multiplier system, particularly for referrals and certain verification types
 * Send Slash System: V2 introduces a new system for handling send slashes, where non senders get slashed
 * Send Earn Minimum Balance: V2 introduces a new minimum balance for send earn deposits
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
    distribution: NonNullable<Awaited<ReturnType<typeof fetchDistribution>>['data']>
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

    // Fetch send slash data
    const { data: sendSlash, error: sendSlashError } = await fetchSendSlash(distribution)

    if (sendSlashError) {
      log.error(sendSlashError, 'Error fetching send slash data')
      throw sendSlashError
    }

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
      (acc, { address, user_id }) => {
        acc[user_id] = normalizeAddress(address)
        return acc
      },
      {} as Record<string, Address>
    )
    const hodlerUserIdByAddress = hodlerAddresses.reduce(
      (acc, { user_id, address }) => {
        acc[normalizeAddress(address)] = user_id
        return acc
      },
      {} as Record<Address, string>
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
    const minBalanceAddresses: { user_id: string; address: Address; balance: bigint }[] =
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

        return balances
          .map(({ user_id, address, balance }) => ({
            user_id,
            address: normalizeAddress(address), // Normalize the address
            balance: BigInt(balance),
          }))
          .filter(({ balance }) => balance >= BigInt(distribution.hodler_min_balance))
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

    const {
      data: earnBalancesTimeline,
      error: earnBalancesError,
      count: earnBalancesCount,
    } = await fetchAllEarnBalancesTimeline(distribution)

    if (earnBalancesError) {
      log.error(earnBalancesError, 'Error fetching earn balances timeline')
      throw earnBalancesError
    }
    if (earnBalancesCount === 0 || earnBalancesTimeline === null) {
      log.warn('No earn balances timeline found')
      return
    }

    const relevantBalances = earnBalancesTimeline
      // Get the latest balance per owner (first occurrence is already the latest due to query ordering)
      .reduce(
        (acc, current) => {
          if (!acc.some((item) => item.owner === current.owner)) {
            acc.push(current)
          }
          return acc
        },
        [] as typeof earnBalancesTimeline
      )
      // Filter by minimum balance requirement
      .filter(({ assets }) => BigInt(assets) >= BigInt(distribution.earn_min_balance))

    const minEarnBalancesByAddress = relevantBalances.reduce(
      (acc, { owner, assets }) => {
        // Type guard ensures owner is a string, but we need to verify it's the right format
        if (typeof owner === 'string' && owner.startsWith('\\x')) {
          const ownerHex = byteaToHex(owner as `\\x${string}`)
          acc[normalizeAddress(ownerHex)] = BigInt(assets)
        }
        return acc
      },
      {} as Record<Address, bigint>
    )

    const { data: previousShares, error: previousSharesError } = await fetchDistributionShares(
      distribution.number - 1
    )

    if (previousSharesError) {
      throw previousSharesError
    }
    assert(previousShares !== null, 'No previous shares found')

    const previousSharesByUserId = previousShares.reduce(
      (acc, share) => {
        acc[share.user_id] = BigInt(share.amount)
        return acc
      },
      {} as Record<string, bigint>
    )

    log.debug(`Found ${Object.keys(previousSharesByUserId).length}`)

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

    const qualifyingUserIds = new Set(
      minBalanceAddresses
        .filter(({ address, user_id }) => {
          return (
            !!minEarnBalancesByAddress[address] &&
            !!hodlerUserIdByAddress[address] &&
            verificationsByUserId[user_id]?.some(
              (v) => v.type === 'tag_registration' && v.weight > 0
            )
          )
        })
        .map(({ user_id }) => user_id)
    )

    // Calculate initial hodler rewards using full distribution amount
    const distAmt = BigInt(distribution.amount)
    let initialHodlerShares: { address: Address; amount: bigint; userId: string }[] = []

    // Initial hodler reward calculation
    const endDate = new Date(distribution.qualification_end)
    const currentDate = new Date() > endDate ? endDate : new Date()
    const hoursInMonth = getHoursInMonth(currentDate)
    const currentHour = getCurrentHourInMonth(currentDate)

    // Calculate time adjustment for initial amounts using full distribution amount
    const hourlyHodlerAmount = (distAmt * PERC_DENOM) / BigInt(hoursInMonth)
    const timeAdjustedAmount =
      (hourlyHodlerAmount * BigInt(currentHour + 1)) / PERC_DENOM > distAmt
        ? distAmt
        : (hourlyHodlerAmount * BigInt(currentHour + 1)) / PERC_DENOM

    // Calculate initial slashed balances
    const initialSlashedBalances = minBalanceAddresses
      .map(({ user_id: userId, balance, address }) => {
        // Check if user is qualifying
        const isQualifying = qualifyingUserIds.has(userId)

        const sendCeilingData = sendCeilingByUserId[userId]
        let slashPercentage = 0n

        if (sendCeilingData && sendCeilingData.weight > 0n && isQualifying) {
          const previousReward =
            previousSharesByUserId[userId] || BigInt(distribution.hodler_min_balance)
          const scaledPreviousReward =
            (previousReward * PERC_DENOM) / BigInt(sendSlash.scaling_divisor)

          const scaledWeight = sendCeilingData.weight * PERC_DENOM
          const cappedWeight =
            scaledWeight > scaledPreviousReward ? scaledPreviousReward : scaledWeight

          slashPercentage = (cappedWeight * PERC_DENOM) / scaledPreviousReward
        }

        const slashedBalance = (balance * slashPercentage) / PERC_DENOM

        return {
          address,
          userId,
          balance: slashedBalance,
        }
      })
      .filter(({ balance }) => balance >= BigInt('0'))

    if (log.isLevelEnabled('debug')) {
      await Bun.write(
        'dist/initialSlashedBalances.json',
        JSON.stringify(initialSlashedBalances, jsonBigint, 2)
      ).catch((e) => {
        log.error(e, 'Error writing initialSlashedBalances.json')
      })
    }

    // Calculate initial weighted shares
    const initialWeightedShares = calculateWeights(
      initialSlashedBalances,
      timeAdjustedAmount,
      Mode.Sigmoid
    )

    initialHodlerShares = initialSlashedBalances.map(({ address, userId }) => ({
      address: address,
      userId: userId,
      amount: initialWeightedShares[address]?.amount || 0n,
      score: 0n, // Default score value will be updated if available
    }))

    log.info(
      {
        hoursInMonth,
        currentHour,
        hourlyHodlerAmount,
        timeAdjustedAmount,
        fullAmount: distAmt,
      },
      'Initial time-based hodler pool calculations'
    )

    // Fetch send scores from the current distribution
    const { data: sendScores, error: sendScoresError } = await fetchSendScores(distribution.id)

    if (sendScoresError) {
      log.warn(
        { error: sendScoresError?.message },
        'Error fetching send scores. Proceeding without scores.'
      )
      throw sendScoresError
    }

    if (!sendScores || sendScores.length === 0) {
      log.warn('No send scores found. Proceeding without scores.')
      throw new Error('No send scores found.')
    }

    // Create a map of scores by user_id
    const scoresByUserId = sendScores.reduce(
      (acc, { user_id, score }) => {
        if (!score || !user_id) {
          return acc
        }
        acc[user_id] = BigInt(score)
        return acc
      },
      {} as Record<string, bigint>
    )

    // Add scores to initialHodlerShares
    initialHodlerShares = initialHodlerShares.map((share) => ({
      ...share,
      score: scoresByUserId?.[share.userId] || 0n,
    }))

    log.info(`Found ${initialHodlerShares.length} hodlers.`)

    if (log.isLevelEnabled('debug')) {
      await Bun.write('dist/sendScores.json', JSON.stringify(sendScores, jsonBigint, 2)).catch(
        (e) => {
          log.error(e, 'Error writing sendScores.json')
        }
      )
    }

    // Create lookup for initial hodler amounts (add this before fixed pool calculation)
    const initialHodlerAmountByAddress = initialHodlerShares.reduce(
      (acc, share) => {
        acc[share.address] = share.amount
        return acc
      },
      {} as Record<string, bigint>
    )

    // TODO: index onchain data in the case these values change
    // Hardcoded ticket price for sendpot_ticket_purchase calculations
    const ticketPrice = COST_PER_TICKET_WEI

    // Calculate fixed pool share weights
    const fixedPoolAvailableAmount = distAmt

    let fixedPoolAllocatedAmount = 0n // This tracks slashed amount
    const fixedPoolAmountsByAddress: Record<string, bigint> = {}

    // Calculate fixed pool amounts
    for (const [userId, verifications] of Object.entries(verificationsByUserId)) {
      const isQualifying = qualifyingUserIds.has(userId)
      const address = hodlerAddressesByUserId[userId]

      if (!isQualifying || !address) continue

      let userFixedAmount = 0n
      const multipliers: Record<string, Multiplier> = {}
      let totalTicketPurchaseValue = 0n

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

        // Standard fixed value calculation for all verification types
        if (verificationValue.fixedValue) {
          userFixedAmount += verificationValue.fixedValue * BigInt(weight)
        }

        // For sendpot_ticket_purchase, also calculate ticket purchase value
        if (
          verification.type ===
          ('sendpot_ticket_purchase' as Database['public']['Enums']['verification_type'])
        ) {
          // Get raw ticket count from metadata
          const ticketCount = BigInt(verification.metadata?.value || 0)
          if (ticketCount > 0n) {
            // Calculate amount spent: ticketCount * ticketPrice
            const ticketPurchaseValue = ticketCount * ticketPrice
            totalTicketPurchaseValue += ticketPurchaseValue
          }
        }

        if (!multiplierInfo) continue

        // Apply multiplier logic using helper
        multiplierInfo.value = calculateMultiplier(weight, multiplierInfo.value, {
          min: multiplierInfo.min,
          max: multiplierInfo.max,
          step: multiplierInfo.step,
        })
      }

      const finalMultiplier = calculateCombinedMultiplier(multipliers)

      // Get initial hodler amount - default to 0 if not found
      // Add ticket purchase value to hodlerCapAmount (amount spent on tickets)
      const hodlerCapAmount =
        (initialHodlerAmountByAddress[address] || 0n) +
        (scoresByUserId[userId] || 0n) +
        totalTicketPurchaseValue

      let amount =
        (userFixedAmount * BigInt(Math.round(finalMultiplier * Number(PERC_DENOM)))) / PERC_DENOM

      // Calculate slashed amount using helper
      const sendCeilingData = sendCeilingByUserId[userId]
      const previousReward =
        previousSharesByUserId[userId] || BigInt(distribution.hodler_min_balance)

      if (sendCeilingData && sendCeilingData.weight > 0n) {
        const slashPercentage = calculateSlashPercentage(
          sendCeilingData.weight,
          previousReward,
          sendSlash.scaling_divisor
        )
        amount = (amount * slashPercentage) / PERC_DENOM
      } else {
        amount = 0n
      }

      if (amount > hodlerCapAmount) {
        if (log.isLevelEnabled('debug')) {
          log.debug(
            { address, original: amount, capped: hodlerCapAmount },
            'Fixed reward capped by hodler amount'
          )
        }
        amount = hodlerCapAmount
      }

      if (fixedPoolAllocatedAmount + amount <= fixedPoolAvailableAmount) {
        fixedPoolAmountsByAddress[address] = amount
        fixedPoolAllocatedAmount += amount
      }
    }

    // Calculate hodler pool share weights
    const hodlerPoolAvailableAmount = distAmt - fixedPoolAllocatedAmount

    let hodlerShares: ReturnType<typeof calculateWeights>[string][] = []

    if (hodlerPoolAvailableAmount > 0n) {
      const endDate = new Date(distribution.qualification_end)
      const currentDate = new Date() > endDate ? endDate : new Date()
      const hoursInMonth = getHoursInMonth(currentDate)
      const currentHour = getCurrentHourInMonth(currentDate)

      // Calculate time adjustment for slashed amounts
      const hourlyHodlerAmount = (hodlerPoolAvailableAmount * PERC_DENOM) / BigInt(hoursInMonth)
      const timeAdjustedAmount =
        (hourlyHodlerAmount * BigInt(currentHour + 1)) / PERC_DENOM > hodlerPoolAvailableAmount
          ? hodlerPoolAvailableAmount
          : (hourlyHodlerAmount * BigInt(currentHour + 1)) / PERC_DENOM

      // Calculate slashed balances
      const slashedBalances = minBalanceAddresses
        .map(({ user_id: userId, balance, address }) => {
          // Check if user is qualifying
          const isQualifying = qualifyingUserIds.has(userId)
          if (!isQualifying) return null

          const sendCeilingData = sendCeilingByUserId[userId]
          let slashPercentage = 0n

          if (sendCeilingData && sendCeilingData.weight > 0n) {
            const previousReward =
              previousSharesByUserId[userId] || BigInt(distribution.hodler_min_balance)
            // Use helper function for consistent slash calculation
            slashPercentage = calculateSlashPercentage(
              sendCeilingData.weight,
              previousReward,
              sendSlash.scaling_divisor
            )
          }

          const slashedBalance = (balance * slashPercentage) / PERC_DENOM

          return {
            address,
            userId,
            balance: slashedBalance,
          }
        })
        .filter((item) => item !== null)

      if (log.isLevelEnabled('debug')) {
        await Bun.write(
          'dist/slashedBalances.json',
          JSON.stringify(slashedBalances, jsonBigint, 2)
        ).catch((e) => {
          log.error(e, 'Error writing slashedBalances.json')
        })
      }

      // Calculate weighted shares
      const weightedShares = calculateWeights(slashedBalances, timeAdjustedAmount, Mode.Sigmoid)

      hodlerShares = Object.values(weightedShares)

      log.info(
        {
          hoursInMonth,
          currentHour,
          hourlyHodlerAmount,
          timeAdjustedAmount,
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

        // Skip if amount is less than 0
        if (amount < 0n) {
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
          balance_rank: share.balanceRank,
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
      if (share.amount === undefined || share.amount === null) {
        log.error({ share }, 'Share missing amount')
        throw new Error(`Share for user ${share.user_id} missing amount`)
      }
    }

    const { error: updateReferralVerificationsError } = await updateReferralVerifications(
      distribution.id,
      shares
    )
    if (updateReferralVerificationsError) {
      log.error(
        {
          error: updateReferralVerificationsError.message,
          code: updateReferralVerificationsError.code,
        },
        'Error updating referral verifications'
      )
      throw updateReferralVerificationsError
    }

    const { error } = await createDistributionShares(distribution.id, shares)
    if (error) {
      log.error({ error: error.message, code: error.code }, 'Error saving shares.')
      throw error
    }
  }

  private async worker() {
    this.log.info('Starting distributor...', { id: this.id })

    // Run immediately on startup
    try {
      await this.calculateDistributions()
    } catch (error) {
      this.log.error(error, `Error processing initial distribution. ${(error as Error).message}`)
    }

    while (this.running) {
      try {
        // Calculate time until next hour
        const now = new Date()
        const nextHour = new Date(now)
        nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0)
        const waitTime = nextHour.getTime() - now.getTime()

        // Wait until next hour
        process.env.NODE_ENV === 'development' ? await sleep(50_000) : await sleep(waitTime)

        await this.calculateDistributions()
      } catch (error) {
        this.log.error(error, `Error processing distribution. ${(error as Error).message}`)
      }
    }

    this.log.info('Distributor stopped.')
  }

  public async stop() {
    this.log.info('Stopping distributor...')
    this.running = false
    return await this.workerPromise
  }

  public async calculateDistribution(id: number) {
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
