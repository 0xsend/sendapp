import { sendEarnAbi } from '@my/wagmi'
import { useReferrer } from 'app/utils/referrer'
import { useSendAccount } from 'app/utils/send-accounts'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { useUserOp } from 'app/utils/userop'
import type { UserOperation } from 'permissionless'
import { useMemo } from 'react'
import { encodeFunctionData, erc20Abi, zeroAddress } from 'viem'
import { useQuery, type UseQueryReturnType } from 'wagmi/query'

/**
 * Fetches the user's send earn deposits.
 */
function useSendEarnDeposits() {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ['send_earn_deposits'],
    queryFn: async () => {
      return await supabase.from('send_earn_deposits').select('*')
    },
  })
}

/**
 * Fetches the user's send earn withdraws.
 */
function useSendEarnWithdraws() {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ['send_earn_withdraws'],
    queryFn: async () => {
      return await supabase
        .from('send_earn_withdraws')
        .select('*')
        .order('assets', { ascending: false })
    },
  })
}

/**
 * Fetches the user's send earn balances.
 */
function useSendEarnBalances() {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ['sendEarnBalances'],
    queryFn: async () => {
      return await supabase.from('send_earn_balances').select('*')
    },
  })
}

/**
 * Determine the vault to deposit into.
 *
 * If ther user already has a deposit balance, then use that vault.
 * Otherwise, use the referrer vault.
 * If there is no referrer, then create a new affilaite vault and deposit into that.
 * Otherwise, deposit into the referrer vault.
 * Finally, if there is no referrer, and no existing deposits, then create a new vault and deposit into that.
 */
export function useSendEarnDepositVault() {
  const referrer = useReferrer()
  const deposits = useSendEarnDeposits()
  const withdraws = useSendEarnWithdraws()
  const balances = useSendEarnBalances()
  // TODO: vault lookup by address
}

/**
 * Hook to create a UserOperation for depositing Send Account assets into
 * Send Earn vaults.
 *
 * TODO: ensure the asset and vault are valid
 *
 * @param {Object} params - The deposit parameters
 * @param {string} params.asset - The address of the ERC20 token to deposit
 * @param {bigint} params.amount - The amount of tokens to deposit
 * @param {string} params.vault - The address of the Send Earn vault
 * @returns {UseQueryReturnType<UserOperation<'v0.7'>, Error>} The UserOperation
 */
export const useSendEarnDepositUserOp = ({
  asset,
  amount,
  vault,
}: {
  asset: `0x${string}`
  amount: bigint
  vault: `0x${string}`
}): UseQueryReturnType<UserOperation<'v0.7'>, Error> => {
  const sendAccount = useSendAccount()
  const sender = useMemo(() => sendAccount?.data?.address, [sendAccount?.data?.address])
  useSendEarnDepositVault()
  // TODO: validate asset

  const calls = useMemo(
    () => [
      {
        dest: asset,
        value: 0n,
        data: encodeFunctionData({
          abi: erc20Abi,
          functionName: 'approve',
          args: [vault, amount],
        }),
      },
      {
        dest: vault,
        value: 0n,
        data: encodeFunctionData({
          abi: sendEarnAbi,
          functionName: 'deposit',
          args: [amount, sender ?? zeroAddress],
        }),
      },
    ],
    [asset, vault, amount, sender]
  )

  const uop = useUserOp({
    sender,
    calls,
  })

  return uop
}

export function useSendEarnReferrer() {
  const referrer = useReferrer() // first lookup the referrer
}
