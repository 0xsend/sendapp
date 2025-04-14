import type { Database } from '@my/supabase/database.types'
import {
  sendEarnAbi,
  useReadErc20BalanceOf,
  useReadMorphoViewGetVaultInfo,
  useReadSendEarnUsdcFactorySplit,
} from '@my/wagmi'
import type { SupabaseClient } from '@supabase/supabase-js'
import { ERC20CoinSchema, type erc20Coin } from 'app/data/coins'
import { assert } from 'app/utils/assert'
import { hexToBytea } from 'app/utils/hexToBytea'
import { mulDivDown, WAD, wMulDown } from 'app/utils/math'
import { useSendAccount } from 'app/utils/send-accounts'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { throwIf } from 'app/utils/throwIf'
import { address, byteaToHexEthAddress, decimalStrToBigInt } from 'app/utils/zod'
import debug from 'debug'
import { useMemo } from 'react'
import { formatUnits, isAddressEqual, zeroAddress } from 'viem'
import { useChainId, useReadContracts } from 'wagmi'
import { queryOptions } from '@tanstack/react-query'
import { hashFn, useQuery, type UseQueryReturnType } from 'wagmi/query'
import { z } from 'zod'
import { AffiliateVaultSchema, type AffiliateVault } from '../zod'

const log = debug('app:earn:hooks')

/**
 * Hook to calculate the Send Earn APY for a specific vault and underlying Metamorpho vault.
 *
 * @param params.vault - The vault address the user wants to deposit into
 * @returns The Send Earn APY
 */
export function useSendEarnAPY({
  vault,
}: {
  vault: `0x${string}` | undefined
}): UseQueryReturnType<{ baseApy: number }, Error> {
  // first fetch details about the send earn vault
  const sendEarnVault = useSendEarnVault(vault)

  const underlyingVaultAddress = sendEarnVault.data?.[0]

  // then fetch the underlying vault
  const underlyingVault = useUnderlyingVault(underlyingVaultAddress)

  return useQuery({
    queryKey: ['sendEarnAPY', { sendEarnVault, underlyingVault }] as const,
    queryKeyHashFn: hashFn,
    enabled: sendEarnVault.isFetched && underlyingVault.isFetched,
    queryFn: ({
      queryKey: [, { sendEarnVault, underlyingVault }],
    }: {
      queryKey: [
        string,
        {
          sendEarnVault: ReturnType<typeof useSendEarnVault>
          underlyingVault: ReturnType<typeof useUnderlyingVault>
        },
      ]
    }): { baseApy: number } => {
      throwIf(sendEarnVault.error)
      throwIf(underlyingVault.error)
      assert(sendEarnVault.isSuccess, 'Fetching send earn vault failed')
      assert(underlyingVault.isSuccess, 'Fetching underlying vault failed')

      return {
        baseApy: calculateBaseApy({
          underlyingVault: underlyingVault.data,
          fee: sendEarnVault.data[1],
        }),
      }
    },
  })
}

/**
 * Hook to fetch the Send Earn vault details.
 *
 * Returns the underlying Metamorpho vault address and the Send Earn fee.
 *
 * @param params.vault - The vault address the user wants to deposit into
 */
function useSendEarnVault(vault: `0x${string}` | undefined) {
  const chainId = useChainId()
  log('useSendEarnVault', { vault })
  return useReadContracts({
    allowFailure: false,
    query: { enabled: !!vault },
    contracts: [
      {
        address: vault ?? zeroAddress,
        abi: sendEarnAbi,
        chainId,
        functionName: 'VAULT',
      },
      {
        address: vault ?? zeroAddress,
        abi: sendEarnAbi,
        functionName: 'fee',
      },
    ],
  })
}

type UnderlyingVault = NonNullable<ReturnType<typeof useUnderlyingVault>['data']>

/**
 * Hook to fetch the underlying vault details using the Morpho Views contract.
 *
 * @note This will only work on a MetaMorpho vault.
 *
 * @param params.underlyingVaultAddress - The underlying vault address
 */
function useUnderlyingVault(underlyingVaultAddress: `0x${string}` | undefined) {
  return useReadMorphoViewGetVaultInfo({
    args: [underlyingVaultAddress ?? zeroAddress],
    query: { enabled: !!underlyingVaultAddress },
  })
}

/**
 * Given an underlying vault and a send earn vault, calculate the base apy.
 *
 * The underlying vault is a MetaMorpho vault that holds the underlying asset.
 *
 * @param params - The vault parameters
 * @param params.underlyingVault - The underlying vault
 * @param params.fee - The Send Earn fee on top of the underlying vault fee*
 * @returns The base apy
 */
function calculateBaseApy({
  underlyingVault,
  fee,
}: {
  underlyingVault: UnderlyingVault
  fee: bigint
}) {
  let ratio = 0n
  for (const market of underlyingVault.markets) {
    ratio += wMulDown(market.marketApy, market.vaultSupplied)
  }
  const avgSupplyApy = mulDivDown(
    ratio,
    WAD - underlyingVault.fee - fee,
    underlyingVault.totalAssets === 0n ? 1n : underlyingVault.totalAssets
  )
  const baseApy = Number(formatUnits(avgSupplyApy, 18)) * 100
  return baseApy
}

const SendEarnBalanceSchema = z.object({
  log_addr: byteaToHexEthAddress,
  owner: byteaToHexEthAddress,
  assets: decimalStrToBigInt,
  shares: decimalStrToBigInt,
})
const SendEarnBalancesSchema = z.array(SendEarnBalanceSchema)
export type SendEarnBalance = z.infer<typeof SendEarnBalanceSchema>

async function fetchSendEarnBalances(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from('send_earn_balances')
    .select('assets::text,log_addr,owner,shares::text')
  if (error) throw error
  return SendEarnBalancesSchema.parse(data)
}

/**
 * Fetches the user's send earn balances from supabase. This includes all
 * send earn vaults the user has deposited into.
 */
export function sendEarnBalancesQueryOptions(supabase: SupabaseClient<Database>) {
  return queryOptions({
    queryKey: ['send_earn_balances', { supabase }] as const,
    queryFn: async () => fetchSendEarnBalances(supabase),
    staleTime: 30_000,
  })
}

export function useSendEarnBalances(): UseQueryReturnType<SendEarnBalance[]> {
  const supabase = useSupabase()
  return useQuery(sendEarnBalancesQueryOptions(supabase))
}

/**
 * Given a list of vault addresses, fetches the underlying asset for each vault.
 */
export function useUnderlyingVaultsAsset(
  vaults: `0x${string}`[] | undefined
): UseQueryReturnType<`0x${string}`[] | undefined> {
  return useReadContracts({
    allowFailure: false,
    contracts: vaults?.map((vault) => ({
      address: vault,
      abi: sendEarnAbi,
      functionName: 'asset',
    })),
    query: {
      enabled: vaults !== undefined,
      gcTime: Number.POSITIVE_INFINITY,
    },
  })
}

/**
 * Given a list of vaults and shares, fetches the assets amount at current rate.
 *
 * @dev vaults list must be the same length as shares list
 */
export function useVaultConvertSharesToAssets({
  vaults,
  shares,
}: {
  vaults: `0x${string}`[] | undefined
  shares: bigint[] | undefined
}): UseQueryReturnType<bigint[] | undefined> {
  const assets: UseQueryReturnType<bigint[] | undefined> = useReadContracts({
    allowFailure: false,
    contracts: vaults?.map((vault, i) => ({
      address: vault,
      abi: sendEarnAbi,
      functionName: 'convertToAssets',
      args: [shares?.[i] ?? 0n],
    })),
    query: { enabled: vaults !== undefined && shares !== undefined },
  })
  log('useVaultConvertSharesToAssets', { assets, vaults, shares })
  return useQuery({
    queryKey: ['vaultConvertSharesToAssets', { assets, vaults, shares }] as const,
    enabled: assets.isFetched,
    queryFn: async ({ queryKey: [, { assets, vaults, shares }] }) => {
      throwIf(assets.error)
      assert(!!vaults, 'Vaults list is undefined')
      assert(!!shares, 'Shares list is undefined')
      assert(vaults.length === shares.length, 'Vaults and shares length mismatch')
      log('fetching vault convert shares to assets', { assets, vaults, shares })
      return assets.data
    },
  })
}

const SendEarnCoinBalanceSchema = z.object({
  log_addr: address,
  owner: address,
  assets: z.bigint(),
  shares: z.bigint(),
  coin: ERC20CoinSchema,
  currentAssets: z.bigint(),
})
const SendEarnCoinBalancesSchema = z.array(SendEarnCoinBalanceSchema)
type SendEarnCoinBalance = z.infer<typeof SendEarnCoinBalanceSchema>

/**
 * React hook to fetch and calculate a user's Send Earn balances for a specific coin/token.
 *
 * You must invalidate the `useSendEarnBalances` query when the coin changes to fetch the latest balances.
 *
 * @param coin - The ERC20 coin/token to fetch balances for. Can be undefined.
 * @returns A React Query result containing an array of SendEarnCoinBalance objects, including:
 *  - Share amounts
 *  - Current asset values
 *  - Associated coin information
 *  - Vault addresses
 *
 * The hook combines data from multiple sources:
 * - Fetches all Send Earn balances
 * - Filters balances for the specified coin
 * - Converts share amounts to underlying asset amounts
 * - Validates and formats the final balance data
 */
export function useSendEarnCoinBalances(
  coin: erc20Coin | undefined
): UseQueryReturnType<SendEarnCoinBalance[]> {
  const allBalances = useSendEarnBalances()
  // filter out balances with zero shares
  const balances = useMemo(
    () => allBalances?.data?.filter((b) => b.shares > 0n),
    [allBalances.data]
  )
  // grab all vaults with balance
  const vaultsWithBalance = useMemo(() => {
    return allBalances?.data?.filter((b) => b.shares > 0n).map((b) => b.log_addr)
  }, [allBalances.data])
  // fetch underlying vault assets
  const vaultAssets = useUnderlyingVaultsAsset(vaultsWithBalance)
  // now filter balances for coin that we can lookup the current coin for
  const balancesForCoin = useMemo(() => {
    if (!coin?.token) return undefined
    return balances?.filter((b, i) =>
      isAddressEqual(vaultAssets.data?.[i] ?? zeroAddress, coin?.token)
    )
  }, [balances, coin?.token, vaultAssets.data])
  // fetch shares for each balance
  const shares = useMemo(() => {
    return balancesForCoin?.map((b) => b.shares)
  }, [balancesForCoin])
  // convert shares to assets
  const assets = useVaultConvertSharesToAssets({
    vaults: vaultsWithBalance,
    shares,
  })
  log('useSendEarnCoinBalances', {
    coin,
    allBalances,
    allVaults: vaultsWithBalance,
    vaultAssets,
    assets,
    balances,
    balancesForCoin,
  })
  return useQuery({
    queryKey: [
      'sendEarnCoinBalances',
      {
        coin,
        allBalances,
        vaultAssets,
        assets,
        balances,
        balancesForCoin,
        shares,
        vaultsWithBalance,
      },
    ] as const,
    enabled: allBalances.isFetched && vaultAssets.isFetched && assets.isFetched && !!coin?.token,
    queryFn: async ({
      queryKey: [
        ,
        {
          coin,
          allBalances,
          vaultAssets,
          assets,
          balances,
          shares,
          balancesForCoin,
          vaultsWithBalance,
        },
      ],
    }) => {
      throwIf(allBalances.error)
      throwIf(vaultAssets.error)
      throwIf(assets.error)
      assert(!!allBalances.data, 'Fetching send earn balances failed')
      assert(!!vaultAssets.data, 'Fetching underlying vault assets failed')
      assert(!!assets.data, 'Fetching vault assets failed')
      assert(!!shares, 'Fetching shares failed')
      assert(!!balancesForCoin, 'Fetching balances for coin failed')
      assert(!!vaultsWithBalance, 'Fetching vaults with balance failed')
      // sanity check
      assert(balancesForCoin?.length === shares?.length, 'Shares and balances length mismatch')
      assert(balancesForCoin?.length === assets.data.length, 'Shares and assets length mismatch')
      assert(vaultsWithBalance?.length === assets.data.length, 'Vaults and assets length mismatch')
      log('fetching send earn coin balances', { coin, allBalances, vaultAssets, assets, balances })
      return SendEarnCoinBalancesSchema.parse(
        balances?.map((b, i) => {
          return {
            ...b,
            coin,
            currentAssets: assets.data?.[i] ?? 0n,
          }
        })
      )
    },
  })
}

/**
 * Fetches the user's affiliate vault information.
 */
export function myAffiliateVaultQueryOptions({
  supabase,
  sendAccount,
}: {
  supabase: SupabaseClient<Database>
  sendAccount: ReturnType<typeof useSendAccount>
}) {
  return queryOptions({
    queryKey: ['myAffiliateVault', { sendAccount }] as const,
    enabled: sendAccount.isFetched,
    queryFn: async ({ queryKey: [, { sendAccount }], signal }): Promise<AffiliateVault | null> => {
      throwIf(sendAccount.error)
      assert(!!sendAccount.data, 'No send account found')
      const { data, error } = await supabase
        .from('send_earn_new_affiliate')
        .select('affiliate, send_earn_affiliate, send_earn_affiliate_vault(send_earn, log_addr)')
        .eq('affiliate', hexToBytea(sendAccount.data?.address))
        .not('send_earn_affiliate_vault', 'is', null)
        .abortSignal(signal)
        .limit(1)
        .maybeSingle()

      if (error) {
        log('Error fetching referrer vault:', error)
        throw error
      }
      log('myAffiliateVault', { data, error })
      return AffiliateVaultSchema.parse(data)
    },
    staleTime: 30_000,
  })
}

export function useMyAffiliateVault(): UseQueryReturnType<AffiliateVault | null> {
  const supabase = useSupabase()
  const sendAccount = useSendAccount()
  return useQuery(myAffiliateVaultQueryOptions({ supabase, sendAccount }))
}

/**
 * Fetches the affiliate split of the Send Earn rewards. Similar to a cast call such as:
 *
 * ```shell
 * cast balance --erc20 <vault> <send_earn_affiliate>
 * ```
 * @link https://github.com/0xsend/send-earn-contracts/blob/6b2a1225008903f2ba4cb745369d2d7c32837533/src/SendEarnAffiliate.sol#L61-L64
 * @returns The user's affiliate earn rewards, including the balance and vault information
 */
export function useMyAffiliateRewards(): UseQueryReturnType<
  { shares: bigint; assets: bigint; vault: AffiliateVault } | null | undefined
> {
  const sendAccount = useSendAccount()
  const myAffiliateVault = useMyAffiliateVault()
  const balance: UseQueryReturnType<bigint | null | undefined> = useMyAffiliateRewardsBalance()
  const split: UseQueryReturnType<bigint | null | undefined> = useReadSendEarnUsdcFactorySplit()
  // vault shares are the balance of the send earn affiliate contract minus the split
  const vaultShares = useMemo(() => {
    if (!balance.data || !split.data) return { shares: undefined, vaults: undefined }
    if (!myAffiliateVault.data?.send_earn_affiliate_vault?.send_earn)
      return { shares: undefined, vaults: undefined }
    const affiliateShares = wMulDown(balance.data ?? 0n, WAD - split.data ?? 0n)
    return {
      shares: [affiliateShares],
      vaults: [myAffiliateVault.data.send_earn_affiliate_vault.send_earn],
    }
  }, [myAffiliateVault.data?.send_earn_affiliate_vault?.send_earn, balance.data, split.data])

  const assets = useVaultConvertSharesToAssets(vaultShares)
  log('useMyAffiliateRewards', { balance, myAffiliateVault, split, vaultShares, assets })

  return useQuery({
    queryKey: [
      'myEarnRewards',
      { sendAccount, myAffiliateVault, balance, assets, vaultShares },
    ] as const,
    queryKeyHashFn: hashFn,
    enabled: sendAccount.isFetched && myAffiliateVault.isFetched,
    queryFn: async ({
      queryKey: [, { sendAccount, myAffiliateVault, balance, assets, vaultShares }],
    }: {
      queryKey: [
        string,
        {
          sendAccount: ReturnType<typeof useSendAccount>
          myAffiliateVault: ReturnType<typeof useMyAffiliateVault>
          balance: UseQueryReturnType<bigint | null | undefined>
          assets: ReturnType<typeof useVaultConvertSharesToAssets>
          vaultShares: { shares: bigint[] | undefined; vaults: `0x${string}`[] | undefined }
        },
      ]
    }): Promise<{ shares: bigint; assets: bigint; vault: AffiliateVault } | null> => {
      throwIf(sendAccount.error)
      throwIf(myAffiliateVault.error)
      throwIf(balance.error)
      throwIf(assets.error)

      assert(!!sendAccount.data, 'No send account found')

      if (!myAffiliateVault.data) return null
      if (!balance.data) return null
      if (!assets.data) return null
      if (!vaultShares.shares) return null

      return {
        shares: vaultShares.shares[0] ?? 0n,
        assets: assets.data[0] ?? 0n,
        vault: myAffiliateVault.data,
      }
    },
  })
}
export function useMyAffiliateRewardsBalance(): UseQueryReturnType<bigint | null | undefined> {
  const myAffiliateVault = useMyAffiliateVault()
  return useReadErc20BalanceOf({
    address: myAffiliateVault.data?.send_earn_affiliate_vault?.send_earn,
    args: [myAffiliateVault.data?.send_earn_affiliate ?? zeroAddress],
    query: { enabled: !!myAffiliateVault.data?.send_earn_affiliate_vault?.send_earn },
  })
}
