import { sendEarnAbi } from '@my/wagmi'
import type { erc20Coin } from 'app/data/coins'
import { useSendEarnCoinBalances } from 'app/features/earn/hooks'
import { assert } from 'app/utils/assert'
import { useSendAccount } from 'app/utils/send-accounts'
import { throwIf } from 'app/utils/throwIf'
import type { SendAccountCall } from 'app/utils/userop'
import debug from 'debug'
import { encodeFunctionData } from 'viem'
import { useQuery, type UseQueryReturnType } from 'wagmi/query'

const log = debug('app:features:earn:withdraw')

type VaultWithBalance = {
  vault: `0x${string}`
  balance: bigint
}

/**
 * Determine all vaults with a balance for this asset.
 *
 * @param {Object} params - The parameters
 * @param {string} params.asset - The address of the ERC20 token to withdraw
 * @returns A query result containing an array of vault addresses with their balances
 */
export function useSendEarnWithdrawVaults({
  asset,
  coin,
}: {
  asset: `0x${string}` | undefined
  coin: erc20Coin | undefined
}): UseQueryReturnType<VaultWithBalance[]> {
  const coinBalances = useSendEarnCoinBalances(coin)
  const sendAccount = useSendAccount()

  return useQuery({
    queryKey: ['sendEarnWithdrawVault', { coinBalances, sendAccount, asset }] as const,
    enabled: asset !== undefined && coinBalances.isFetched && sendAccount.isFetched,
    queryFn: async ({ queryKey: [, { coinBalances, sendAccount, asset }] }) => {
      throwIf(coinBalances.error)
      throwIf(sendAccount.error)
      assert(asset !== undefined, 'Asset is not defined')

      // Find all vaults with a balance for this asset
      const vaultsWithBalance: VaultWithBalance[] = Array.isArray(coinBalances.data)
        ? coinBalances.data
            .filter(
              (balance) =>
                balance.currentAssets !== null &&
                balance.currentAssets > 0n &&
                balance.log_addr !== null
            )
            .map((balance) => ({
              vault: balance.log_addr,
              balance: balance.currentAssets,
            }))
        : []

      log('Found vaults with balance:', vaultsWithBalance)
      return vaultsWithBalance
    },
  })
}

/**
 * Hook to create a send account calls for withdrawing Send Account assets from
 * Send Earn vaults.
 *
 * It will return send account calls for withdrawing tokens from one or more Send Earn vaults.
 * If the amount exceeds a single vault's balance, it will split the withdrawal across multiple vaults.
 *
 * @param {Object} params - The withdraw parameters
 * @param {string} params.sender - The address of the sender
 * @param {string} params.asset - The address of the ERC20 token to withdraw
 * @param {bigint} params.amount - The amount of tokens to withdraw
 * @param {erc20Coin} params.coin - The coin to withdraw
 * @returns {UseQueryReturnType<SendAccountCall[], Error>} The SendAccountCalls
 */
export function useSendEarnWithdrawCalls({
  sender,
  asset,
  amount,
  coin,
}: {
  sender: `0x${string}` | undefined
  asset: `0x${string}` | undefined
  amount: bigint | undefined
  coin: erc20Coin | undefined
}): UseQueryReturnType<SendAccountCall[] | null> {
  const vaults = useSendEarnWithdrawVaults({ asset, coin })

  return useQuery({
    queryKey: ['sendEarnWithdrawCalls', { sender, asset, amount, vaults }] as const,
    enabled:
      vaults.isFetched &&
      sender !== undefined &&
      asset !== undefined &&
      amount !== undefined &&
      amount > 0n,
    queryFn: async (): Promise<SendAccountCall[] | null> => {
      throwIf(vaults.error)
      assert(asset !== undefined, 'Asset is not defined')
      assert(amount !== undefined, 'Amount is not defined')
      assert(amount > 0n, 'Amount must be greater than 0')
      assert(!!sender, 'Sender is not defined')

      if (vaults.isPending || !vaults.data || vaults.data.length === 0) {
        log('No vaults found to withdraw from')
        return null
      }

      // Sort vaults by balance (largest first) to optimize withdrawal
      const sortedVaults = [...vaults.data].sort((a, b) => {
        if (a.balance > b.balance) return -1
        if (a.balance < b.balance) return 1
        return 0
      })

      const calls: SendAccountCall[] = []
      let remainingAmount = amount

      // Distribute the withdrawal amount across vaults
      for (const vaultWithBalance of sortedVaults) {
        if (remainingAmount <= 0n) break

        const withdrawAmount =
          remainingAmount > vaultWithBalance.balance ? vaultWithBalance.balance : remainingAmount

        calls.push({
          dest: vaultWithBalance.vault,
          value: 0n,
          data: encodeFunctionData({
            abi: sendEarnAbi,
            functionName: 'withdraw',
            args: [withdrawAmount, sender, sender],
          }),
        })

        remainingAmount -= withdrawAmount
        log(`Withdrawing ${withdrawAmount} from vault ${vaultWithBalance.vault}`)
      }

      if (remainingAmount > 0n) {
        log('Warning: Requested amount exceeds total vault balances')
        throw new Error('Requested withdrawal amount exceeds total available balance in vaults')
      }

      log('Created withdraw calls:', calls)
      return calls
    },
  })
}
