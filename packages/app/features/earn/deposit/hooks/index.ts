import { sendEarnFactoryAbi } from '@0xsend/send-earn-contracts'
import type { Database } from '@my/supabase/database.types'
import { sendEarnAbi, sendEarnUsdcFactoryAddress, usdcAddress } from '@my/wagmi'
import type { SupabaseClient } from '@supabase/supabase-js'
import { assert } from 'app/utils/assert'
import { byteaToHex } from 'app/utils/byteaToHex'
import { hexToBytea } from 'app/utils/hexToBytea'
import { useReferrer } from 'app/utils/referrer'
import { useSendAccount } from 'app/utils/send-accounts'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { throwIf } from 'app/utils/throwIf'
import type { SendAccountCall } from 'app/utils/userop'
import debug from 'debug'
import { getRandomBytes } from 'expo-crypto'
import { bytesToHex, encodeFunctionData, erc20Abi, zeroAddress } from 'viem'
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
 * 3. Otherwise, return null
 *
 * @returns A query result containing the vault address to deposit into
 */
export function useSendEarnDepositVault({
  asset,
}: { asset: `0x${string}` }): UseQueryReturnType<`0x${string}` | null> {
  const referrerVault = useReferrerVault()
  const balances = useSendEarnBalances()
  const sendAccount = useSendAccount()

  return useQuery({
    queryKey: ['sendEarnDepositVault', { referrerVault, balances, sendAccount, asset }] as const,
    enabled: !balances.isLoading && !referrerVault.isLoading && !sendAccount.isLoading,
    queryFn: async ({ queryKey: [, { referrerVault, balances, sendAccount }] }) => {
      throwIf(referrerVault.error)
      throwIf(balances.error)
      throwIf(sendAccount.error)

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

      log('No existing deposits and no referrer.')
      return null
    },
  })
}

/**
 * Hook to create a send account calls for depositing Send Account assets into
 * Send Earn vaults.
 *
 * It will return send account calls for depositing USDC tokens into a Send Earn vault.
 *
 * Which vault depends on the asset, the referrer, and if the user has existing deposits.
 *
 * @param {Object} params - The deposit parameters
 * @param {string} params.asset - The address of the ERC20 token to deposit
 * @param {bigint} params.amount - The amount of tokens to deposit
 * @returns {UseQueryReturnType<UserOperation<'v0.7'>, Error>} The UserOperation
 */

export function useSendEarnDepositCalls({
  sender,
  asset,
  amount,
}: { sender: `0x${string}` | undefined; asset: `0x${string}`; amount: bigint }): UseQueryReturnType<
  SendAccountCall[] | null
> {
  const vault = useSendEarnDepositVault({ asset })
  const referrer = useReferrer()
  const factory = useSendEarnFactory({ asset })

  return useQuery({
    queryKey: [
      'sendEarnDepositCalls',
      { sender, asset, amount, vault, referrer, factory },
    ] as const,
    enabled: !vault.isLoading && !referrer.isLoading && !factory.isLoading,
    queryFn: async (): Promise<SendAccountCall[] | null> => {
      throwIf(vault.error)
      throwIf(referrer.error)
      throwIf(factory.error)
      assert(!!factory.data, 'Factory data is not defined')
      if (vault.isPending) return null

      if (vault.data) {
        // use deposit vault if it exists, user is already onboarded
        log('using deposit vault')
        return [
          {
            dest: asset,
            value: 0n,
            data: encodeFunctionData({
              abi: erc20Abi,
              functionName: 'approve',
              args: [vault.data, amount],
            }),
          },
          {
            dest: vault.data,
            value: 0n,
            data: encodeFunctionData({
              abi: sendEarnAbi,
              functionName: 'deposit',
              args: [amount, sender ?? zeroAddress],
            }),
          },
        ]
      }

      log('No existing deposits', { referrer: referrer.data?.address, factory: factory.data })
      // zero address means no referrer, use default vault for deposit (factory will handle this for us onchain)
      const referrerAddr = referrer.data?.address ?? zeroAddress
      const salt = bytesToHex(getRandomBytes(32))
      return [
        {
          dest: asset,
          value: 0n,
          data: encodeFunctionData({
            abi: erc20Abi,
            functionName: 'approve',
            args: [factory.data, amount],
          }),
        },
        {
          dest: factory.data,
          value: 0n,
          data: encodeFunctionData({
            abi: sendEarnFactoryAbi,
            functionName: 'createAndDeposit',
            args: [referrerAddr, salt, amount],
          }),
        },
      ]
    },
  })
}

/**
 * Fetches the Send Earn Factory address for the given asset. If the asset is not supported, it will throw an error.
 */
function useSendEarnFactory({
  asset,
}: { asset: `0x${string}` }): UseQueryReturnType<`0x${string}`> {
  const chainId = useChainId()
  return useQuery({
    queryKey: ['sendEarnFactory', { asset, chainId }] as const,
    queryFn: async ({ queryKey: [, { asset }] }): Promise<`0x${string}`> => {
      assert(isSupportedAsset(asset), 'Asset is not supported')
      const factory = assetsToEarnFactory[asset]
      assert(!!factory, 'Asset is not supported')
      return factory
    },
  })
}

type SendEarnAssets = keyof typeof assetsToEarnFactory
/**
 * Maps asset addresses to the Send Earn Factory chainId -> addresses.
 */
const assetsToEarnFactory = Object.fromEntries([
  ...Object.entries(usdcAddress).map(([chainId, addr]) => [
    addr,
    sendEarnUsdcFactoryAddress[chainId],
  ]),
]) as Record<`0x${string}`, `0x${string}`>

export function isSupportedAsset(asset: `0x${string}`): asset is SendEarnAssets {
  return assetsToEarnFactory[asset] !== undefined
}
