import type { Database } from '@my/supabase/database-generated.types'
import { sendEarnAbi } from '@my/wagmi'
import type { SupabaseClient } from '@supabase/supabase-js'
import { assert } from 'app/utils/assert'
import { mulDivDown, WAD, wMulDown } from 'app/utils/math'
import { useSupabase } from 'app/utils/supabase/useSupabase'
import { throwIf } from 'app/utils/throwIf'
import debug from 'debug'
import { formatUnits, zeroAddress } from 'viem'
import { useChainId, useReadContract, useReadContracts } from 'wagmi'
import { hashFn, useQuery, type UseQueryReturnType } from 'wagmi/query'

const log = debug('app:earn:hooks')

export function useVaultInfo(vaultAddress: `0x${string}`) {
  const chainId = useChainId()
  return useReadContract({
    address: morphoViews,
    abi: morphoViewAbi,
    chainId: chainId,
    functionName: 'getVaultInfo',
    args: [vaultAddress],
  })
}

// TODO: add more addresses to other chains or think of a workaround
const morphoViews = '0xc72fCC9793a10b9c363EeaAcaAbe422E0672B42B'
const morphoViewAbi = [
  {
    type: 'function',
    name: 'getVaultInfo',
    inputs: [
      {
        name: '_vault',
        type: 'address',
        internalType: 'contract IMetaMorpho',
      },
    ],
    outputs: [
      {
        name: '',
        type: 'tuple',
        internalType: 'struct MorphoViews.MorphoVault',
        components: [
          {
            name: 'vault',
            type: 'address',
            internalType: 'address',
          },
          {
            name: 'totalSupply',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'totalAssets',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'underlyingPrice',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'fee',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'timelock',
            type: 'uint256',
            internalType: 'uint256',
          },
          {
            name: 'markets',
            type: 'tuple[]',
            internalType: 'struct MorphoViews.MorphoVaultMarketsInfo[]',
            components: [
              {
                name: 'marketId',
                type: 'bytes32',
                internalType: 'Id',
              },
              {
                name: 'marketCollateral',
                type: 'address',
                internalType: 'address',
              },
              {
                name: 'marketCollateralName',
                type: 'string',
                internalType: 'string',
              },
              {
                name: 'marketCollateralSymbol',
                type: 'string',
                internalType: 'string',
              },
              {
                name: 'marketLiquidity',
                type: 'uint256',
                internalType: 'uint256',
              },
              {
                name: 'marketLltv',
                type: 'uint256',
                internalType: 'uint256',
              },
              {
                name: 'marketApy',
                type: 'uint256',
                internalType: 'uint256',
              },
              {
                name: 'vaultAllocation',
                type: 'uint256',
                internalType: 'uint256',
              },
              {
                name: 'vaultSupplied',
                type: 'uint256',
                internalType: 'uint256',
              },
            ],
          },
        ],
      },
    ],
    stateMutability: 'view',
  },
] as const

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
    enabled: !sendEarnVault.isLoading && !underlyingVault.isLoading,
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
  return useReadContract({
    address: morphoViews,
    abi: morphoViewAbi,
    functionName: 'getVaultInfo',
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
 * @param params.fee - The Send Earn fee on top of the underlying vault fee* @returns The base apy
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

export type SendEarnBalance = NonNullable<Awaited<ReturnType<typeof fetchSendEarnBalances>>>[number]

async function fetchSendEarnBalances(supabase: SupabaseClient<Database>) {
  const { data, error } = await supabase
    .from('send_earn_balances')
    .select('assets::text,log_addr,owner,shares::text')
  if (error) throw error
  if (!data) return null
  return data.map(
    (d) =>
      ({
        ...d,
        assets: BigInt(d.assets ?? 0n),
        shares: BigInt(d.shares ?? 0n),
      }) as {
        assets: bigint
        shares: bigint
        log_addr: `\\x${string}`
        owner: `\\x${string}`
      }
  )
}

/**
 * Fetches the user's send earn balances.
 */
export function useSendEarnBalances(): UseQueryReturnType<SendEarnBalance[] | null> {
  const supabase = useSupabase()
  return useQuery({
    queryKey: ['sendEarnBalances', supabase] as const,
    queryFn: async ({ queryKey: [, supabase] }): Promise<SendEarnBalance[] | null> =>
      fetchSendEarnBalances(supabase),
  })
}
