import { cpus } from 'os'
import { Database, Functions, Tables } from '@my/supabase/database.types'
import { sendABI as sendTokenABI, sendAddress as sendTokenAddress } from '@my/wagmi'
import { createClient } from '@supabase/supabase-js'
import { LRUCache } from 'lru-cache'
import type { Logger } from 'pino'
import { http, createPublicClient, getContract } from 'viem'
import { mainnet } from 'viem/chains'

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
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE!,
  { auth: { persistSession: false } }
)

const client = createPublicClient({
  chain: mainnet,
  transport: http(process.env.NEXT_PUBLIC_MAINNET_RPC_URL),
})

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
  private lastBlockNumber = 17579999n // send token deployment block
  private lastBlockNumberAt: Date
  private id: string
  private workerPromise: Promise<void>
  private blockTimestamps = new LRUCache<`0x${string}`, bigint>({
    max: 100,
  })

  constructor(log: Logger) {
    this.id = Math.random().toString(36).substring(7)
    this.log = log.child({ module: 'distributor', id: this.id })
    this.running = true
    this.lastBlockNumberAt = new Date()
    this.workerPromise = this.worker()
  }

  private async saveTransfers(from: bigint, to: bigint) {
    this.log.debug(`Getting transfers for block ${from}-${to}...`)

    const transfers = await client.getLogs({
      event: {
        type: 'event',
        inputs: [
          {
            name: 'from',
            type: 'address',
            indexed: true,
          },
          {
            name: 'to',
            type: 'address',
            indexed: true,
          },
          {
            name: 'value',
            type: 'uint256',
            indexed: false,
          },
        ],
        name: 'Transfer',
      },
      address: sendTokenAddress[client.chain.id],
      strict: true,
      fromBlock: from,
      toBlock: to,
    })

    if (transfers.length === 0) {
      this.log.debug('No transfers found.')
      return
    }

    this.log.debug(`Got ${transfers.length} transfers.`)

    // fetch the block timestamps in batches
    const batches = inBatches(transfers).flatMap(async (transfers) => {
      return await Promise.all(
        transfers.map(async (transfer) => {
          const { blockHash, blockNumber, transactionHash, logIndex, args } = transfer
          const { from, to, value }: { from: string; to: string; value: bigint } = args
          const blockTimestamp = await this.getBlockTimestamp(blockHash)
          return {
            block_hash: blockHash,
            block_number: blockNumber.toString(),
            block_timestamp: new Date(Number(blockTimestamp) * 1000),
            tx_hash: transactionHash,
            log_index: logIndex.toString(),
            from,
            to,
            value: value.toString(),
          }
        })
      )
    })
    let rows: {
      block_hash: `0x${string}`
      block_number: string
      block_timestamp: Date
      tx_hash: `0x${string}`
      log_index: string
      from: string
      to: string
      value: string
    }[] = []
    for await (const batch of batches) {
      rows = rows.concat(...batch)
    }

    if (rows.length === 0) {
      this.log.debug('No transfers found.')
      return []
    }

    this.log.debug({ rows: rows[0] }, `Saving ${rows.length} transfers...`)

    const { error } = await supabaseAdmin
      .from('send_transfer_logs')
      // @ts-expect-error supabase-js does not support bigint
      .upsert(rows, { onConflict: 'block_hash,tx_hash,log_index' })

    if (error) {
      this.log.error({ error: error.message, code: error.code }, 'Error saving transfers.')
      throw error
    }
  }

  private async getBlockTimestamp(blockHash: `0x${string}`) {
    const cachedTimestamp = this.blockTimestamps.get(blockHash)
    if (cachedTimestamp) {
      return cachedTimestamp
    }
    const { timestamp } = await client.getBlock({ blockHash })
    this.blockTimestamps.set(blockHash, timestamp)
    return this.blockTimestamps.get(blockHash)!
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
  ) {
    // fetch all verifications
    const verifications: Tables<'distribution_verifications'>[] = await (async () => {
      const _verifications: Tables<'distribution_verifications'>[] = []
      let page = 0
      let totalCount: number | null = null

      do {
        const { data, count, error } = await supabaseAdmin
          .from('distribution_verifications')
          .select('*', { count: 'exact' })
          .eq('distribution_id', distribution.id)
          .range(page, page + 1000)

        if (error) {
          this.log.error(
            { error: error.message, code: error.code },
            'Error fetching verifications.'
          )
          throw error
        }

        if (totalCount === null) {
          totalCount = count
        }

        _verifications.push(...data)
        page += 1000
      } while (totalCount && _verifications.length < totalCount)

      return _verifications
    })()

    this.log.info(`Found ${verifications.length} verifications.`)
    this.log.debug({ verifications })

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

    this.log.info(`Found ${Object.keys(verificationsByUserId).length} users with verifications.`)
    this.log.debug({ verificationsByUserId })

    const hodlerAddresses: Functions<'distribution_hodler_addresses'> = await (async () => {
      const _hodlerAddresses: Functions<'distribution_hodler_addresses'> = []
      let page = 0
      let totalCount: number | null = null

      do {
        const { data, count, error } = await supabaseAdmin
          .rpc(
            'distribution_hodler_addresses',
            {
              distribution_id: distribution.id,
            },
            { count: 'exact' }
          )
          .select('*')
          .range(page, page + 1000)

        if (error) {
          this.log.error({ error: error.message, code: error.code }, 'Error fetching addresses.')
          throw error
        }

        if (totalCount === null) {
          totalCount = count
        }

        _hodlerAddresses.push(...data)
        page += 1000
      } while (totalCount && _hodlerAddresses.length < totalCount)

      return _hodlerAddresses
    })()

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

    this.log.info(`Found ${hodlerAddresses.length} addresses.`)
    this.log.debug({ hodlerAddresses })

    // lookup balances of all hodler addresses in qualification period
    const sendTokenContract = getContract({
      abi: sendTokenABI,
      address: sendTokenAddress[client.chain.id],
      publicClient: client,
    })
    const batches = inBatches(hodlerAddresses).flatMap(async (addresses) => {
      return await Promise.all(
        addresses.map(async ({ user_id, address }) => {
          // use snapshot id if available
          const balance =
            distribution.snapshot_id !== null
              ? await sendTokenContract.read.balanceOfAt([
                  address as `0x${string}`,
                  BigInt(distribution.snapshot_id),
                ])
              : await sendTokenContract.read.balanceOf([address as `0x${string}`])
          return {
            user_id,
            address: address as `0x${string}`,
            balance: balance.toString(),
          }
        })
      )
    })

    let balances: { user_id: string; address: `0x${string}`; balance: string }[] = []
    for await (const batch of batches) {
      balances = balances.concat(...batch)
    }

    this.log.info(`Found ${balances.length} balances.`)
    this.log.debug({ balances })

    // Filter out hodler with not enough send token balance
    balances = balances.filter(
      ({ balance }) => BigInt(balance) >= BigInt(distribution.hodler_min_balance)
    )

    this.log.info(`Found ${balances.length} balances after filtering.`)
    this.log.debug({ balances })

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

    this.log.info(
      { totalWeight, hodlerPoolAvailableAmount, weightPerSend },
      `Calculated ${Object.keys(poolWeights).length} weights.`
    )
    this.log.debug({ poolWeights })

    if (totalWeight === 0n) {
      this.log.warn('Total weight is 0. Skipping distribution.')
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
        this.log.debug({ userId }, 'Hodler not found for user Skipping verification.')
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

    this.log.info(
      {
        maxBonusPoolBips,
      },
      'Calculated fixed & bonus pool amounts.'
    )
    this.log.debug({ hodlerShares, fixedPoolAmountsByAddress, bonusPoolBipsByAddress })

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
          this.log.debug({ share }, 'Hodler not found for address. Skipping share.')
          return null
        }

        this.log.debug(
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

    this.log.info(
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
    this.log.info(`Calculated ${shares.length} shares.`)
    this.log.debug({ shares })
    const { error } = await supabaseAdmin.rpc('update_distribution_shares', {
      distribution_id: distribution.id,
      shares,
    })
    if (error) {
      this.log.error({ error: error.message, code: error.code }, 'Error saving shares.')
      throw error
    }
    return shares
  }

  private async worker() {
    this.log.info('Starting distributor...', { id: this.id })

    // lookup last block number
    const { data: latestTransfer, error } = await supabaseAdmin
      .from('send_transfer_logs')
      .select('*')
      .order('block_number', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      this.log.error(
        { error: error.message, code: error.code, details: error.details },
        'Error fetching last block number.'
      )
      if (error.code !== 'PGRST116') {
        throw error
      }
    }

    if (latestTransfer) {
      this.log.debug({ latestTransfer }, 'Found latest transfer.')
      this.lastBlockNumber = BigInt(latestTransfer.block_number)
    } else {
      this.log.debug('No transfers found. Using default block number.')
    }

    this.log.info(`Using last block number ${this.lastBlockNumber}.`)

    let latestBlockNumber = await client.getBlockNumber()
    const cancel = client.watchBlocks({
      onBlock: async (block) => {
        if (block.number <= this.lastBlockNumber) {
          return
        }
        this.log.info(`New block ${block.number}`)
        latestBlockNumber = block.number
      },
    })

    while (this.running) {
      try {
        if (latestBlockNumber <= this.lastBlockNumber) {
          if (new Date().getTime() - this.lastBlockNumberAt.getTime() > 30000) {
            this.log.warn('No new blocks found')
          }
          await sleep(client.pollingInterval)
          continue
        }

        this.log.info(`Processing block ${latestBlockNumber}`)

        // Always analyze back to finalized block handle reorgs/forked blocks
        const { number: finalizedBlockNumber } = await client.getBlock({ blockTag: 'finalized' })
        const from =
          this.lastBlockNumber < finalizedBlockNumber ? this.lastBlockNumber : finalizedBlockNumber
        const to = latestBlockNumber
        await this.saveTransfers(from, to)
        await this.calculateDistributions()

        // update last block number
        this.lastBlockNumberAt = new Date()
        this.lastBlockNumber = latestBlockNumber
      } catch (error) {
        this.log.error(error, `Error processing block. ${(error as Error).message}`)
        await sleep(client.pollingInterval)
        // skip to next block
      }
    }

    cancel()

    this.log.info('Distributor stopped.', {
      lastBlockNumber: this.lastBlockNumber,
      lastBlockNumberAt: this.lastBlockNumberAt,
    })
  }

  public async stop() {
    this.log.info('Stopping distributor...')
    this.running = false
    return await this.workerPromise
  }

  public isRunning() {
    return this.running
  }

  public getLastBlockNumber() {
    return this.lastBlockNumber
  }

  public getLastBlockNumberAt() {
    return this.lastBlockNumberAt
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
      lastBlockNumber: this.lastBlockNumber.toString(),
      lastBlockNumberAt: this.lastBlockNumberAt.toISOString(),
      running: this.running,
      calculateDistribution: this.calculateDistribution.bind(this),
    }
  }
}
