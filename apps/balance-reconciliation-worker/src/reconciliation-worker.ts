import type { SupabaseClient } from '@supabase/supabase-js'
import type { PublicClient, Address, Hex } from 'viem'
import type { Logger } from 'pino'
import { erc20Abi } from 'viem'

interface WorkerConfig {
  batchSize: number
  rateLimitMs: number
  pollIntervalMs: number
  chainId: number
}

interface BalancePair {
  send_account_address: string // hex string from DB
  chain_id: number
  token_address: string // hex string from DB
  calculated_balance: string
  is_rebasing: boolean
  last_snapshot: string
  usd_value: string
  last_updated_time: string
}

export class ReconciliationWorker {
  private running = false
  private pollTimer?: NodeJS.Timeout

  constructor(
    private deps: {
      supabase: SupabaseClient
      publicClient: PublicClient
      logger: Logger
      config: WorkerConfig
    }
  ) {}

  async start(): Promise<void> {
    if (this.running) {
      this.deps.logger.warn('Worker already running')
      return
    }

    this.running = true
    this.deps.logger.info('Worker started')

    // Run immediately on start
    await this.reconciliationLoop()

    // Then schedule periodic runs
    this.pollTimer = setInterval(() => this.reconciliationLoop(), this.deps.config.pollIntervalMs)
  }

  async stop(): Promise<void> {
    if (!this.running) return

    this.running = false
    if (this.pollTimer) {
      clearInterval(this.pollTimer)
      this.pollTimer = undefined
    }

    this.deps.logger.info('Worker stopped')
  }

  private async reconciliationLoop(): Promise<void> {
    const startTime = Date.now()
    this.deps.logger.info('Starting reconciliation loop')

    try {
      // Get balances needing reconciliation
      const { data: pairs, error } = await this.deps.supabase.rpc('get_balances_to_reconcile', {
        p_limit: this.deps.config.batchSize,
      })

      if (error) {
        this.deps.logger.error({ error }, 'Failed to fetch balances to reconcile')
        return
      }

      if (!pairs || pairs.length === 0) {
        this.deps.logger.info('No balances to reconcile')
        return
      }

      this.deps.logger.info({ count: pairs.length }, 'Processing balance reconciliations')

      let processed = 0
      let reconciled = 0
      let errors = 0

      for (const pair of pairs as BalancePair[]) {
        if (!this.running) {
          this.deps.logger.info('Worker stopped during reconciliation loop')
          break
        }

        try {
          const didReconcile = await this.reconcileBalance(pair)
          if (didReconcile) reconciled++
          processed++

          // Rate limiting
          if (this.deps.config.rateLimitMs > 0) {
            await this.sleep(this.deps.config.rateLimitMs)
          }
        } catch (error) {
          errors++
          this.deps.logger.error(
            { error, pair: this.formatPairForLog(pair) },
            'Failed to reconcile balance'
          )
        }
      }

      const duration = Date.now() - startTime
      this.deps.logger.info(
        { processed, reconciled, errors, duration },
        'Reconciliation loop completed'
      )
    } catch (error) {
      this.deps.logger.error({ error }, 'Reconciliation loop failed')
    }
  }

  private async reconcileBalance(pair: BalancePair): Promise<boolean> {
    const { send_account_address, token_address, calculated_balance } = pair

    // Convert hex strings to Address format
    const accountAddress = `0x${send_account_address}` as Address
    const tokenAddress = `0x${token_address}` as Address

    // Get last indexed block for this address/token
    const { data: lastIndexedBlock } = await this.deps.supabase
      .from('send_account_transfers')
      .select('block_num')
      .eq('log_addr', `\\x${token_address}`)
      .or(`f.eq.\\x${send_account_address},t.eq.\\x${send_account_address}`)
      .order('block_num', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!lastIndexedBlock?.block_num) {
      this.deps.logger.debug(
        { pair: this.formatPairForLog(pair) },
        'No indexed transfers found for this pair, skipping'
      )
      return false
    }

    const lastIndexedBlockNum = BigInt(lastIndexedBlock.block_num)

    // Safety: Only reconcile up to N-1 block where N is the last indexed block
    // This is because the indexer may still be processing transfers for block N
    // We can only trust blocks that the indexer has moved past
    const safeReconciliationBlock = lastIndexedBlockNum - 1n

    if (safeReconciliationBlock < 0n) {
      this.deps.logger.debug(
        { pair: this.formatPairForLog(pair) },
        'Not enough blocks indexed yet for safe reconciliation'
      )
      return false
    }

    // Fetch actual balance from RPC at the safe reconciliation block
    // This ensures we're comparing against a fully-indexed block
    const rpcBalance = await this.deps.publicClient.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [accountAddress],
      blockNumber: safeReconciliationBlock,
    })

    const dbBalance = BigInt(calculated_balance)
    const drift = rpcBalance - dbBalance

    // Store snapshot at the safe reconciliation block
    await this.storeSnapshot(pair, rpcBalance, safeReconciliationBlock, drift)

    // Check if reconciliation is needed
    const needsReconciliation = this.shouldReconcile(dbBalance, rpcBalance, drift)

    if (!needsReconciliation) {
      return false
    }

    // Determine reconciliation reason
    const reason = this.detectReconciliationReason(pair, drift)

    this.deps.logger.warn(
      {
        pair: this.formatPairForLog(pair),
        dbBalance: dbBalance.toString(),
        rpcBalance: rpcBalance.toString(),
        drift: drift.toString(),
        reason,
      },
      'Balance drift detected, reconciling'
    )

    // Store reconciliation record
    await this.storeReconciliation(
      pair,
      drift,
      dbBalance,
      rpcBalance,
      reason,
      safeReconciliationBlock
    )

    // Apply reconciliation
    await this.applyReconciliation(pair, drift, safeReconciliationBlock)

    return true
  }

  private shouldReconcile(dbBalance: bigint, rpcBalance: bigint, drift: bigint): boolean {
    // Reconcile any drift at all
    return drift !== 0n
  }

  private detectReconciliationReason(pair: BalancePair, drift: bigint): string {
    // Known rebasing token
    if (pair.is_rebasing) {
      return 'rebasing'
    }

    // TODO: Add logic to detect missed transfers by checking block gaps
    // For now, classify as unknown
    return 'unknown'
  }

  private async storeSnapshot(
    pair: BalancePair,
    balance: bigint,
    block: bigint,
    drift: bigint
  ): Promise<void> {
    const { error } = await this.deps.supabase.rpc('store_balance_snapshot', {
      p_send_account_address: `\\x${pair.send_account_address}`,
      p_chain_id: pair.chain_id,
      p_token_address: `\\x${pair.token_address}`,
      p_balance: balance.toString(),
      p_snapshot_block: block.toString(),
      p_drift_from_calculated: drift.toString(),
    })

    if (error) {
      throw new Error(`Failed to store snapshot: ${error.message}`)
    }
  }

  private async storeReconciliation(
    pair: BalancePair,
    drift: bigint,
    dbBalance: bigint,
    rpcBalance: bigint,
    reason: string,
    block: bigint
  ): Promise<void> {
    const { error } = await this.deps.supabase.rpc('store_reconciliation', {
      p_send_account_address: `\\x${pair.send_account_address}`,
      p_chain_id: pair.chain_id,
      p_token_address: `\\x${pair.token_address}`,
      p_drift_amount: drift.toString(),
      p_db_balance_before: dbBalance.toString(),
      p_rpc_balance: rpcBalance.toString(),
      p_reconciliation_reason: reason,
      p_reconciled_block: block.toString(),
    })

    if (error) {
      throw new Error(`Failed to store reconciliation: ${error.message}`)
    }
  }

  private async applyReconciliation(
    pair: BalancePair,
    adjustment: bigint,
    block: bigint
  ): Promise<void> {
    const { error } = await this.deps.supabase.rpc('apply_balance_reconciliation', {
      p_send_account_address: `\\x${pair.send_account_address}`,
      p_chain_id: pair.chain_id,
      p_token_address: `\\x${pair.token_address}`,
      p_adjustment: adjustment.toString(),
      p_block_num: block.toString(),
    })

    if (error) {
      throw new Error(`Failed to apply reconciliation: ${error.message}`)
    }
  }

  private formatPairForLog(pair: BalancePair) {
    return {
      account: `0x${pair.send_account_address.slice(0, 8)}...`,
      token: `0x${pair.token_address.slice(0, 8)}...`,
      chain_id: pair.chain_id,
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}
