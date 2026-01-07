import { createPublicClient, createWalletClient, http, erc20Abi } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'
import { base } from 'viem/chains'
import type {
  RevenueConfig,
  VaultBalances,
  SweepResult,
  SweepRecord,
  RevenueError,
  SkippedVault,
  HarvestResult,
  TransactionRecord,
  VaultRevenue,
} from './types'
import { REVENUE_ADDRESSES } from './types'
import { buildClaimArrays } from './merkl'

/**
 * SendEarn ABI subset for collections() and collect() functions.
 */
const sendEarnAbi = [
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

/**
 * Merkl Distributor ABI subset for claim() function.
 */
const merklDistributorAbi = [
  {
    type: 'function',
    name: 'claim',
    inputs: [
      { name: 'users', type: 'address[]' },
      { name: 'tokens', type: 'address[]' },
      { name: 'amounts', type: 'uint256[]' },
      { name: 'proofs', type: 'bytes32[][]' },
    ],
    outputs: [],
    stateMutability: 'nonpayable',
  },
] as const

/**
 * Internal: Create a public client for reading from the chain.
 */
function createReadClient(rpcUrl: string) {
  return createPublicClient({
    chain: base,
    transport: http(rpcUrl),
  })
}

/**
 * Internal: Create a wallet client for writing transactions.
 */
function createWriteClient(rpcUrl: string, privateKey: string) {
  const account = privateKeyToAccount(privateKey as `0x${string}`)
  const walletClient = createWalletClient({
    account,
    chain: base,
    transport: http(rpcUrl),
  })
  return { walletClient, account }
}

/**
 * Get current MORPHO and WELL balances for vaults.
 */
export async function getVaultBalances(
  config: RevenueConfig,
  vaults: `0x${string}`[]
): Promise<VaultBalances[]> {
  const client = createReadClient(config.rpcUrl)
  const results: VaultBalances[] = []

  for (const vault of vaults) {
    try {
      const [morphoBalance, wellBalance] = await Promise.all([
        client.readContract({
          address: REVENUE_ADDRESSES.MORPHO_TOKEN as `0x${string}`,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [vault],
        }),
        client.readContract({
          address: REVENUE_ADDRESSES.WELL_TOKEN as `0x${string}`,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [vault],
        }),
      ])

      results.push({ vault, morphoBalance, wellBalance })
    } catch (error) {
      console.warn(`Failed to fetch balances for vault ${vault}:`, error)
      results.push({ vault, morphoBalance: 0n, wellBalance: 0n })
    }
  }

  return results
}

/**
 * Execute harvest transactions (Merkl.claim).
 * FAIL FAST: If batch claim fails (e.g., stale proofs), abort the entire batch.
 * User must re-run with fresh proofs to complete remaining vaults.
 */
export async function executeHarvest(
  config: RevenueConfig,
  vaultRevenue: VaultRevenue[]
): Promise<HarvestResult> {
  if (!config.collectorPrivateKey) {
    throw new Error('REVENUE_COLLECTOR_PRIVATE_KEY not configured')
  }

  const transactions: TransactionRecord[] = []

  const batchClaim = buildClaimArrays(vaultRevenue)

  if (batchClaim.users.length === 0) {
    return { harvested: { morpho: 0n, well: 0n }, transactions: [], errors: [] }
  }

  const client = createReadClient(config.rpcUrl)
  const { walletClient, account } = createWriteClient(config.rpcUrl, config.collectorPrivateKey)

  console.log(`Executing harvest for ${batchClaim.users.length} claims from ${account.address}`)

  // Helper to get block timestamp
  async function getBlockTimestamp(blockNumber: bigint): Promise<bigint> {
    const block = await client.getBlock({ blockNumber })
    return block.timestamp
  }

  // Helper to record harvests
  async function recordHarvests(
    harvestsToRecord: VaultRevenue[],
    txHash: `0x${string}`,
    blockNumber: bigint
  ): Promise<void> {
    const blockTime = await getBlockTimestamp(blockNumber)

    for (const revenue of harvestsToRecord) {
      if (revenue.morphoAmount > 0n) {
        transactions.push({
          vault: revenue.vault,
          token: REVENUE_ADDRESSES.MORPHO_TOKEN as `0x${string}`,
          amount: revenue.morphoAmount,
          txHash,
          blockNum: blockNumber,
          blockTime,
        })
      }
      if (revenue.wellAmount > 0n) {
        transactions.push({
          vault: revenue.vault,
          token: REVENUE_ADDRESSES.WELL_TOKEN as `0x${string}`,
          amount: revenue.wellAmount,
          txHash,
          blockNum: blockNumber,
          blockTime,
        })
      }
    }
  }

  // Execute batch harvest - fail fast on any error (e.g., stale proofs)
  const txHash = await walletClient.writeContract({
    address: REVENUE_ADDRESSES.MERKL_DISTRIBUTOR as `0x${string}`,
    abi: merklDistributorAbi,
    functionName: 'claim',
    args: [batchClaim.users, batchClaim.tokens, batchClaim.amounts, batchClaim.proofs],
  })

  console.log(`Batch harvest tx submitted: ${txHash}`)

  const receipt = await client.waitForTransactionReceipt({ hash: txHash })

  if (receipt.status !== 'success') {
    // Transaction reverted - fail fast with error
    throw new Error(
      `Harvest batch reverted (tx: ${txHash}). Proofs may be stale. Re-run with fresh proofs.`
    )
  }

  await recordHarvests(vaultRevenue, txHash, receipt.blockNumber)
  console.log(`Batch harvest successful: ${transactions.length} harvests`)

  const morphoTotal = transactions
    .filter((t) => t.token.toLowerCase() === REVENUE_ADDRESSES.MORPHO_TOKEN.toLowerCase())
    .reduce((sum, t) => sum + t.amount, 0n)
  const wellTotal = transactions
    .filter((t) => t.token.toLowerCase() === REVENUE_ADDRESSES.WELL_TOKEN.toLowerCase())
    .reduce((sum, t) => sum + t.amount, 0n)

  return {
    harvested: { morpho: morphoTotal, well: wellTotal },
    transactions,
    errors: [],
  }
}

/**
 * Sweep tokens from vaults to revenue safe via SendEarn.collect().
 * CRITICAL: Reads FRESH balances internally - do not pass pre-harvest balances.
 */
export async function executeSweep(
  config: RevenueConfig,
  vaults: `0x${string}`[]
): Promise<SweepResult> {
  if (!config.collectorPrivateKey) {
    throw new Error('REVENUE_COLLECTOR_PRIVATE_KEY not configured')
  }

  const transactions: SweepRecord[] = []
  const errors: RevenueError[] = []
  const skipped: SkippedVault[] = []

  const client = createReadClient(config.rpcUrl)
  const { walletClient, account } = createWriteClient(config.rpcUrl, config.collectorPrivateKey)
  const revenueSafe = REVENUE_ADDRESSES.REVENUE_SAFE

  const tokens = [
    REVENUE_ADDRESSES.MORPHO_TOKEN as `0x${string}`,
    REVENUE_ADDRESSES.WELL_TOKEN as `0x${string}`,
  ]

  console.log(`Sweeping ${vaults.length} vaults to ${revenueSafe} from ${account.address}`)

  for (const vault of vaults) {
    // Safety check: Verify collections address matches revenue safe
    try {
      const collections = await client.readContract({
        address: vault,
        abi: sendEarnAbi,
        functionName: 'collections',
      })

      if (collections.toLowerCase() !== revenueSafe.toLowerCase()) {
        const reason = `Collections mismatch: ${collections} !== ${revenueSafe}`
        skipped.push({ vault, reason })
        errors.push({ vault, step: 'sweep', error: reason })
        console.warn(`Skipping vault ${vault}: ${reason}`)
        continue
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      errors.push({ vault, step: 'sweep', error: `Failed to read collections: ${errorMessage}` })
      console.error(`Failed to read collections for ${vault}: ${errorMessage}`)
      continue
    }

    for (const token of tokens) {
      // Read FRESH balance
      let balance: bigint
      try {
        balance = await client.readContract({
          address: token,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [vault],
        })
      } catch (error) {
        console.warn(`Failed to read balance for ${vault}/${token}`)
        continue
      }

      if (balance === 0n) {
        continue
      }

      try {
        const txHash = await walletClient.writeContract({
          address: vault,
          abi: sendEarnAbi,
          functionName: 'collect',
          args: [token],
        })

        console.log(`Sweep tx for ${vault}/${token}: ${txHash}`)

        const receipt = await client.waitForTransactionReceipt({ hash: txHash })

        if (receipt.status === 'success') {
          const block = await client.getBlock({ blockNumber: receipt.blockNumber })
          transactions.push({
            vault,
            token,
            amount: balance,
            destination: revenueSafe as `0x${string}`,
            txHash: receipt.transactionHash,
            blockNum: receipt.blockNumber,
            blockTime: block.timestamp,
          })
          console.log(`Sweep successful for ${vault}/${token}: ${balance.toString()}`)
        } else {
          errors.push({ vault, step: 'sweep', error: `Transaction reverted for token ${token}` })
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        errors.push({ vault, step: 'sweep', error: `${token}: ${errorMessage}` })
        console.error(`Sweep failed for ${vault}/${token}: ${errorMessage}`)
      }
    }
  }

  const morphoTotal = transactions
    .filter((t) => t.token.toLowerCase() === REVENUE_ADDRESSES.MORPHO_TOKEN.toLowerCase())
    .reduce((sum, t) => sum + t.amount, 0n)
  const wellTotal = transactions
    .filter((t) => t.token.toLowerCase() === REVENUE_ADDRESSES.WELL_TOKEN.toLowerCase())
    .reduce((sum, t) => sum + t.amount, 0n)

  return {
    swept: { morpho: morphoTotal, well: wellTotal },
    transactions,
    skipped,
    errors,
  }
}
