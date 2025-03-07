import type { Database } from '@my/supabase/database.types'
import { sendEarnAbi } from '@my/wagmi'
import type { SupabaseClient } from '@supabase/supabase-js'
import { byteaToHex } from 'app/utils/byteaToHex'
import { useReferrer } from 'app/utils/referrer'
import { useSendAccount } from 'app/utils/send-accounts'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { throwIf } from 'app/utils/throwIf'
import { useUserOp } from 'app/utils/userop'
import type { UserOperation } from 'permissionless'
import { useMemo } from 'react'
import { encodeFunctionData, erc20Abi, zeroAddress } from 'viem'
import { useQuery, type UseQueryReturnType } from 'wagmi/query'
import debug from 'debug'

const log = debug('app:features:earn')

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

type SendEarnBalance = NonNullable<Awaited<ReturnType<typeof fetchSendEarnBalances>>>[number]

async function fetchSendEarnBalances(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from('send_earn_balances')
    .select('assets::text,log_addr,owner,shares::text')
  if (error) throw error
  if (!data) return null
  return data.map((d) => ({
    ...d,
    assets: BigInt(d.assets ?? 0n),
    shares: BigInt(d.shares ?? 0n),
  }))
}

/**
 * Fetches the user's send earn balances.
 */
function useSendEarnBalances(): UseQueryReturnType<SendEarnBalance[] | null> {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ['sendEarnBalances', supabase] as const,
    queryFn: async ({ queryKey: [, supabase] }): Promise<SendEarnBalance[] | null> =>
      fetchSendEarnBalances(supabase),
  })
}

/**
 * Determine the vault to deposit into.
 *
 * If the user already has a deposit balance, then use that vault.
 * Otherwise, use the referrer vault.
 * If there is no referrer, then create a new affiliate vault and deposit into that.
 * Otherwise, deposit into the referrer vault.
 * Finally, if there is no referrer, and no existing deposits, then create a new vault and deposit into that.
 *
 * @returns The vault address to deposit into or null if a new vault needs to be created
 */
export function useSendEarnDepositVault() {
  const referrer = useReferrer()
  const balances = useSendEarnBalances()
  const sendAccount = useSendAccount()
  return useQuery({
    // Include the dependencies directly in the queryKey
    queryKey: ['sendEarnDepositVault', { referrer, balances, sendAccount }] as const,
    enabled: !balances.isLoading && !referrer.isLoading && !sendAccount.isLoading,
    queryFn: async ({ queryKey: [, { referrer, balances, sendAccount }] }) => {
      throwIf(referrer.isError)
      throwIf(balances.isError)
      throwIf(sendAccount.isError)
      // If user has existing deposit balances, use that vault
      const userBalances = Array.isArray(balances.data)
        ? balances.data.filter(
            (balance: SendEarnBalance) =>
              balance.assets !== null && balance.assets > 0 && balance.log_addr !== null
          )
        : []

      if (userBalances.length > 0 && userBalances[0]) {
        const addr = userBalances[0].log_addr
        return byteaToHex(addr)
      }

      // If user has no existing deposits but has a referrer, use referrer's vault
      if (referrer.data) {
        // Here we would need to look up the referrer's vault address
        // For now, we'll return null to indicate we need to create a new vault
        log("referrer has no deposits, but has a referrer. TODO: lookup referrer's vault")
        return null
      }

      // If no existing deposits and no referrer, return null to create a new vault
      return null
    },
  })
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
