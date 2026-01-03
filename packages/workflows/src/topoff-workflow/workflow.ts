import { proxyActivities, log as workflowLog } from '@temporalio/workflow'
import type * as activities from './activities'
import { TOPOFF_ACCOUNTS } from './config'

const {
  checkAndTopOffAccount,
  logTopOffSummary,
  calculateTotalETHNeeded,
  calculateTotalUSDCNeeded,
  checkFundingWalletEthBalance,
  checkUSDCBalance,
} = proxyActivities<typeof activities>({
  startToCloseTimeout: '5 minutes',
  // No retry policy - activities throw non-retryable errors
  // This is a cron job running every 15 minutes, so we fail fast
  // and let the next scheduled run handle any issues
})

/**
 * Top-off workflow that checks and tops off all configured accounts
 * Runs on a schedule (every 15 minutes by default)
 *
 * Process:
 * 1. Calculate total ETH and USDC needed for all top-offs
 * 2. Check funding wallet has sufficient ETH and USDC
 * 3. If sufficient funds, perform all top-offs sequentially
 * 4. Log summary
 */
export async function topOffAccounts(): Promise<void> {
  workflowLog.info('Starting top-off workflow')

  // Calculate how much ETH and USDC we need for all top-offs
  const totalETHNeeded = await calculateTotalETHNeeded(TOPOFF_ACCOUNTS)
  const totalUSDCNeeded = await calculateTotalUSDCNeeded(TOPOFF_ACCOUNTS)

  workflowLog.info(`Total ETH needed: ${totalETHNeeded.toString()} wei`)
  workflowLog.info(`Total USDC needed: ${totalUSDCNeeded.toString()} (6 decimals)`)

  if (totalETHNeeded === 0n && totalUSDCNeeded === 0n) {
    workflowLog.info('No top-offs needed, all accounts have sufficient balance')
    return
  }

  // Check if funding wallet has sufficient balances
  if (totalETHNeeded > 0n) {
    const ethBalance = await checkFundingWalletEthBalance()
    workflowLog.info(`Funding wallet ETH balance: ${ethBalance.toString()} wei`)

    if (ethBalance < totalETHNeeded) {
      workflowLog.warn(
        `Insufficient ETH in funding wallet: need ${totalETHNeeded.toString()} wei, have ${ethBalance.toString()} wei. Skipping ETH top-offs.`
      )
    }
  }

  if (totalUSDCNeeded > 0n) {
    const usdcBalance = await checkUSDCBalance()
    workflowLog.info(`Funding wallet USDC balance: ${usdcBalance.toString()} (6 decimals)`)

    if (usdcBalance < totalUSDCNeeded) {
      workflowLog.warn(
        `Insufficient USDC in funding wallet: need ${totalUSDCNeeded.toString()}, have ${usdcBalance.toString()}. Skipping USDC top-offs.`
      )
    }
  }

  // Check and top off all accounts sequentially for better visibility
  workflowLog.info('Starting account top-offs')
  const results: Awaited<ReturnType<typeof checkAndTopOffAccount>>[] = []
  for (const account of TOPOFF_ACCOUNTS) {
    const result = await checkAndTopOffAccount(account)
    results.push(result)
  }

  // Log summary
  await logTopOffSummary(results)

  workflowLog.info('Top-off workflow completed')
}
