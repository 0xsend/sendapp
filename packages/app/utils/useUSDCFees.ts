import {
  baseMainnet,
  tokenPaymasterAbi,
  tokenPaymasterAddress,
  useReadTokenPaymasterCachedPrice,
  useReadTokenPaymasterTokenDecimals,
  useReadTokenPaymasterTokenPaymasterConfig,
} from '@my/wagmi'
import type { UserOperation } from 'permissionless'
import type { Chain, PublicClient, Transport } from 'viem'
import { usePublicClient } from 'wagmi'
import { useQuery, type UseQueryReturnType } from 'wagmi/query'
import { assert } from './assert'
import debugBase from 'debug'
import { throwIf } from './throwIf'

const debug = debugBase('app:utils:fetchUserOpFeeEstimate')

const PRICE_DENOM = BigInt(1e26)

/**
 * Calculates the required prefund for a user operation based on the Entrypoint 0.7 contract.
 * @param userOp - The user operation to estimate the gas for.
 * @returns The required prefund.
 * @see https://github.com/eth-infinitism/account-abstraction/blob/f2b09e60a92d5b3177c68d9f382912ccac19e8db/contracts/core/EntryPoint.sol#L402
 */
export function calculatePrefund(userOp: UserOperation<'v0.7'>): bigint {
  const requiredGas =
    userOp.verificationGasLimit +
    userOp.callGasLimit +
    (userOp.paymasterVerificationGasLimit ?? 0n) +
    (userOp.paymasterPostOpGasLimit ?? 0n) +
    userOp.preVerificationGas
  return requiredGas * userOp.maxFeePerGas
}
/**
 * Fetches the required USDC balance for executing a user operation based on the cached Token Paymaster price
 * along with the base fee.
 *
 * @param userOp - The user operation to estimate the gas for.
 * @returns The required USDC balances broken down by gas fees and base fee.
 */
export function useUSDCFees({
  userOp,
}: { userOp?: UserOperation<'v0.7'> }): UseQueryReturnType<
  { gasFees: bigint; baseFee: bigint; decimals: number },
  Error
> {
  const client = usePublicClient({
    chainId: baseMainnet.id,
  })
  const {
    data: paymasterConfig,
    isLoading: isLoadingPaymasterConfig,
    error: paymasterConfigError,
  } = useReadTokenPaymasterTokenPaymasterConfig({
    chainId: baseMainnet.id,
  })
  const {
    data: cachedPrice,
    isLoading: isLoadingCachedPrice,
    error: cachedPriceError,
  } = useReadTokenPaymasterCachedPrice({
    chainId: baseMainnet.id,
  })
  const {
    data: tokenDecimals,
    isLoading: isLoadingTokenDecimals,
    error: tokenDecimalsError,
  } = useReadTokenPaymasterTokenDecimals({
    chainId: baseMainnet.id,
  })
  return useQuery({
    queryKey: [
      'userOpGasEstimate',
      {
        userOp,
        client,
        cachedPrice,
        paymasterConfig,
        paymasterConfigError,
        cachedPriceError,
        tokenDecimals,
        tokenDecimalsError,
      },
    ] as const,
    enabled:
      !!userOp &&
      !isLoadingCachedPrice &&
      !!client &&
      !isLoadingPaymasterConfig &&
      !isLoadingTokenDecimals,
    queryFn: async ({
      queryKey: [
        ,
        {
          userOp,
          client,
          cachedPrice,
          tokenDecimals,
          paymasterConfig,
          paymasterConfigError,
          cachedPriceError,
          tokenDecimalsError,
        },
      ],
    }) => {
      assert(!!userOp, 'User op is required')
      assert(!!client, 'Client is required')
      assert(!!cachedPrice, 'cachedPrice is required')
      assert(!!paymasterConfig, 'paymasterConfig is required')
      assert(!!tokenDecimals, 'tokenDecimals is required')

      throwIf(paymasterConfigError)
      throwIf(cachedPriceError)
      throwIf(tokenDecimalsError)

      const [
        priceMarkup,
        , // minEntryPointBalance,
        refundPostopCost,
        , // priceMaxAge,
        baseFee,
        , // rewardsPool
      ] = paymasterConfig
      const cachedPriceWithMarkup = (cachedPrice * PRICE_DENOM) / priceMarkup
      debug('Fetching required USDC balance', {
        cachedPriceWithMarkup,
        priceMarkup,
        refundPostopCost,
        baseFee,
      })
      const requiredUsdcBalance = await fetchRequiredUSDCBalance({
        userOp,
        refundPostopCost,
        client,
        cachedPriceWithMarkup,
      })

      const result = {
        decimals: tokenDecimals,
        gasFees: requiredUsdcBalance,
        baseFee: BigInt(baseFee),
      }
      debug('Required USDC balance', result)

      return result
    },
  })
}

/**
 * Fetches the required usdc balance for executing a user operation (excluding the base fee).
 * @param userOp - The user operation to estimate the gas for.
 * @param refundPostopCost - The refund postop cost of the Paymaster.
 * @param client - The client to use for reading the token paymaster contract.
 * @param cachedPriceWithMarkup - The cached price with markup.
 * @returns The required usdc balance.
 */
export async function fetchRequiredUSDCBalance<TTransport extends Transport, TChain extends Chain>({
  userOp,
  refundPostopCost,
  client,
  cachedPriceWithMarkup,
}: {
  userOp: UserOperation<'v0.7'>
  refundPostopCost: number
  client: PublicClient<TTransport, TChain>
  cachedPriceWithMarkup: bigint
}) {
  const requiredPreFund = calculatePrefund(userOp)
  const addedPostOpCost = BigInt(refundPostopCost) * userOp.maxFeePerGas
  const preChargeNative = requiredPreFund + addedPostOpCost
  const requiredUsdcBalance = await client.readContract({
    address: tokenPaymasterAddress[client.chain.id],
    abi: tokenPaymasterAbi,
    functionName: 'weiToToken',
    args: [preChargeNative, cachedPriceWithMarkup],
  })
  return requiredUsdcBalance
}
