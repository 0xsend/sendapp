import type { Database, Tables } from '@my/supabase/database.types'
import { log, ApplicationFailure } from '@temporalio/activity'
import { cpus } from 'node:os'
import {
  createDistributionShares,
  fetchAllHodlers,
  fetchAllOpenDistributions,
  fetchAllVerifications,
  fetchDistribution,
} from './supabase'
import { fetchAllBalances, isMerkleDropActive } from './wagmi'
import { calculatePercentageWithBips, calculateWeights, PERC_DENOM } from './weights'
import { bootstrap } from '@my/workflows/utils'

const cpuCount = cpus().length

const inBatches = <T>(array: T[], batchSize = Math.max(8, cpuCount - 1)) => {
  return Array.from({ length: Math.ceil(array.length / batchSize) }, (_, i) =>
    array.slice(i * batchSize, (i + 1) * batchSize)
  )
}

export function createDistributionActivities(env: Record<string, string | undefined>) {
  bootstrap(env)
}

async function fetchAllOpenDistributionsActivity() {
  const { data: distributions, error } = await fetchAllOpenDistributions()
  if (error) {
    if (error.code === 'PGRST116') {
      log.info('fetchAllOpenDistributionsActivity', { error })
      return null
    }
    throw ApplicationFailure.nonRetryable('Error fetching distributions.', error.code, error)
  }
  log.info('fetchAllOpenDistributionsActivity', { distributions })
  return distributions
}

async function fetchDistributionActivity(distributionId: string) {
  const { data: distribution, error } = await fetchDistribution(distributionId)
  if (error) {
    if (error.code === 'PGRST116') {
      log.info('fetchDistributionActivity', { distributionId, error })
      return null
    }
    throw ApplicationFailure.nonRetryable('Error fetching distribution.', error.code, error)
  }
  log.info('fetchDistributionActivity', { distribution })
  return distribution
}

/**
 * Calculates distribution shares for a single distribution.
 */
async function calculateDistributionSharesActivity(
  distribution: Tables<'distributions'> & {
    distribution_verification_values: Tables<'distribution_verification_values'>[]
  }
): Promise<void> {
  log.info('calculateDistributionSharesActivity', { distribution })
  // verify tranche is not created when in production
  if (await isMerkleDropActive(distribution)) {
    throw ApplicationFailure.nonRetryable(
      'Tranche is active. Cannot calculate distribution shares.'
    )
  }

  log.info('Calculating distribution shares')

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

  // lookup balances of all hodler addresses in qualification period
  const batches = inBatches(hodlerAddresses).flatMap(async (addresses) => {
    return await Promise.all(
      fetchAllBalances({
        addresses,
        distribution,
      })
    )
  })

  let minBalanceAddresses: { user_id: string; address: `0x${string}`; balance: string }[] = []
  for await (const batch of batches) {
    minBalanceAddresses = minBalanceAddresses.concat(...batch)
  }

  log.info(`Found ${minBalanceAddresses.length} balances.`)
  // log.debug({ balances })

  // Filter out hodler with not enough send token balance
  minBalanceAddresses = minBalanceAddresses.filter(
    ({ balance }) => BigInt(balance) >= BigInt(distribution.hodler_min_balance)
  )

  log.info(
    `Found ${minBalanceAddresses.length} balances after filtering hodler_min_balance of ${distribution.hodler_min_balance}`
  )
  // log.debug({ balances })

  // Calculate hodler pool share weights
  const distAmt = BigInt(distribution.amount)
  const hodlerPoolBips = BigInt(distribution.hodler_pool_bips)
  const fixedPoolBips = BigInt(distribution.fixed_pool_bips)
  const bonusPoolBips = BigInt(distribution.bonus_pool_bips)
  const hodlerPoolAvailableAmount = calculatePercentageWithBips(distAmt, hodlerPoolBips)
  const minBalanceByAddress: Record<string, bigint> = minBalanceAddresses.reduce(
    (acc, balance) => {
      acc[balance.address] = BigInt(balance.balance)
      return acc
    },
    {} as Record<string, bigint>
  )
  const { totalWeight, weightPerSend, poolWeights, weightedShares } = calculateWeights(
    minBalanceAddresses,
    hodlerPoolAvailableAmount
  )

  log.info(`Calculated ${Object.keys(poolWeights).length} weights.`, {
    totalWeight,
    hodlerPoolAvailableAmount,
    weightPerSend,
  })
  // log.debug({ poolWeights })

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
      continue
    }
    const { address } = hodler
    if (!minBalanceByAddress[address]) {
      continue
    }
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

  log.info('Calculated fixed & bonus pool amounts.', {
    maxBonusPoolBips,
  })

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
        log.debug('Hodler not found for address. Skipping share.', { share })
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
        bonus_pool_amount: bonusPoolAmount.toString(),
        fixed_pool_amount: fixedPoolAmount.toString(),
        hodler_pool_amount: hodlerPoolAmount.toString(),
      } as Tables<'distribution_shares'>
    })
    .filter(Boolean) as Tables<'distribution_shares'>[]

  log.info('Distribution totals', {
    totalAmount,
    totalHodlerPoolAmount,
    hodlerPoolAvailableAmount,
    totalBonusPoolAmount,
    totalFixedPoolAmount,
    fixedPoolAllocatedAmount,
    fixedPoolAvailableAmount,
    maxBonusPoolBips,
    name: distribution.name,
    shares: shares.length,
  })
  log.info(`Calculated ${shares.length} shares.`)

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
    log.error('Error saving shares.', { error: error.message, code: error.code })
    throw error
  }
}
