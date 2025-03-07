import type { Database } from '@my/supabase/database.types'
import { sendEarnAbi, sendEarnAddress } from '@my/wagmi'
import type { SupabaseClient } from '@supabase/supabase-js'
import { byteaToHex } from 'app/utils/byteaToHex'
import { hexToBytea } from 'app/utils/hexToBytea'
import { useReferrer } from 'app/utils/referrer'
import { useSendAccount } from 'app/utils/send-accounts'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { throwIf } from 'app/utils/throwIf'
import { useUserOp } from 'app/utils/userop'
import debug from 'debug'
import type { UserOperation } from 'permissionless'
import { useMemo } from 'react'
import { encodeFunctionData, erc20Abi, zeroAddress } from 'viem'
import { useChainId } from 'wagmi'
import { useQuery, type UseQueryReturnType } from 'wagmi/query'

const log = debug('app:features:earn')

/**
 * Fetches the referrer's vault address from the send_earn_new_affiliate table.
 */
export function useReferrerVault(): UseQueryReturnType<`0x${string}` | null> {
  const supabase = useSupabase()
  const referrer = useReferrer()

  return useQuery({
    queryKey: ['referrerVault', { supabase, referrer }] as const,
    queryFn: async ({ queryKey: [, { supabase, referrer }] }) => {
      throwIf(referrer.isError)
      const address = referrer.data?.address
      if (!address) return null
      const { data, error } = await supabase
        .from('send_earn_new_affiliate')
        .select('send_earn_affiliate')
        .eq('affiliate', hexToBytea(address))
        .limit(1)
        .maybeSingle()

      if (error) {
        log('Error fetching referrer vault:', error)
        throw error
      }

      if (!data || !data?.send_earn_affiliate) {
        log('No vault found for referrer:', address)
        return null
      }

      const vaultBytea = data.send_earn_affiliate
      return byteaToHex(vaultBytea)
    },
    enabled: !referrer.isLoading,
  })
}

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
 * Priority order:
 * 1. If the user has existing deposits, use their current vault
 * 2. If there's a referrer vault, use that
 * 3. Otherwise, use the default vault for the current chain
 *
 * @returns A query result containing the vault address to deposit into
 */
export function useSendEarnDepositVault() {
  const referrerVault = useReferrerVault()
  const balances = useSendEarnBalances()
  const sendAccount = useSendAccount()
  const chainId = useChainId()

  return useQuery({
    queryKey: ['sendEarnDepositVault', { referrerVault, balances, sendAccount }] as const,
    enabled: !balances.isLoading && !referrerVault.isLoading && !sendAccount.isLoading,
    queryFn: async ({ queryKey: [, { referrerVault, balances, sendAccount }] }) => {
      throwIf(referrerVault.isError)
      throwIf(balances.isError)
      throwIf(sendAccount.isError)
      const userBalances = Array.isArray(balances.data)
        ? balances.data.filter(
            (balance: SendEarnBalance) =>
              balance.assets !== null && balance.assets > 0 && balance.log_addr !== null
          )
        : []

      if (userBalances.length > 0 && userBalances[0]) {
        const addr = byteaToHex(userBalances[0].log_addr)
        log('Found existing deposit. Using existing vault:', addr)
        return addr
      }

      if (referrerVault.data) {
        log(
          'referrer has no deposits, but has a referrer. Using referrer vault:',
          referrerVault.data
        )
        return referrerVault.data
      }

      log('No existing deposits and no referrer. Using default vault.', sendEarnAddress[chainId])
      return sendEarnAddress[chainId]
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
