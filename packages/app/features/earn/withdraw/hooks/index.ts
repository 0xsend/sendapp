import { sendEarnAbi } from '@my/wagmi'
import { useSendEarnBalances, useSendEarnCoinBalances } from 'app/features/earn/hooks'
import { assert } from 'app/utils/assert'
import { useSendAccount } from 'app/utils/send-accounts'
import { throwIf } from 'app/utils/throwIf'
import type { SendAccountCall } from 'app/utils/userop'
import debug from 'debug'
import { encodeFunctionData, zeroAddress } from 'viem'
import { useQuery, type UseQueryReturnType } from 'wagmi/query'
import type { erc20Coin } from 'app/data/coins'

const log = debug('app:features:earn:withdraw')

/**
 * Determine the vault to withdraw from.
 *
 * TODO: return all the vaults with a balance for this asset
 *
 * @param {Object} params - The parameters
 * @param {string} params.asset - The address of the ERC20 token to withdraw
 * @returns A query result containing the vault address to withdraw from
 */
export function useSendEarnWithdrawVault({
  asset,
  coin,
}: {
  asset: `0x${string}` | undefined
  coin: erc20Coin | undefined
}): UseQueryReturnType<`0x${string}` | null> {
  const coinBalances = useSendEarnCoinBalances(coin)
  const sendAccount = useSendAccount()

  return useQuery({
    queryKey: ['sendEarnWithdrawVault', { coinBalances, sendAccount, asset }] as const,
    enabled: asset !== undefined && coinBalances.isFetched && sendAccount.isFetched,
    queryFn: async ({ queryKey: [, { coinBalances, sendAccount, asset }] }) => {
      throwIf(coinBalances.error)
      throwIf(sendAccount.error)
      assert(asset !== undefined, 'Asset is not defined')

      // Find the vault with a balance for this asset
      const userBalances = Array.isArray(coinBalances.data)
        ? coinBalances.data.filter(
            (balance) => balance.assets !== null && balance.assets > 0 && balance.log_addr !== null
          )
        : []

      if (userBalances.length > 0 && userBalances[0]) {
        const addr = userBalances[0].log_addr
        log('Found existing deposit. Using vault:', addr)
        return addr
      }

      log('No existing deposits found for this asset.')
      return null
    },
  })
}

/**
 * Hook to create a send account calls for withdrawing Send Account assets from
 * Send Earn vaults.
 *
 * It will return send account calls for withdrawing tokens from a Send Earn vault.
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
  const vault = useSendEarnWithdrawVault({ asset, coin })

  return useQuery({
    queryKey: ['sendEarnWithdrawCalls', { sender, asset, amount, vault }] as const,
    enabled: !vault.isLoading && asset !== undefined && amount !== undefined && amount > 0n,
    queryFn: async (): Promise<SendAccountCall[] | null> => {
      throwIf(vault.error)
      assert(asset !== undefined, 'Asset is not defined')
      assert(amount !== undefined, 'Amount is not defined')
      assert(amount > 0n, 'Amount must be greater than 0')

      if (vault.isPending || !vault.data) {
        log('No vault found to withdraw from')
        return null
      }

      log('Withdrawing from vault', vault.data)

      // For withdrawing, we only need to call the withdraw function on the vault
      return [
        {
          dest: vault.data,
          value: 0n,
          data: encodeFunctionData({
            abi: sendEarnAbi,
            functionName: 'withdraw',
            args: [amount, sender ?? zeroAddress, sender ?? zeroAddress],
          }),
        },
      ]
    },
  })
}
