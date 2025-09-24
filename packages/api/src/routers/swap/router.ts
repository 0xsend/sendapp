import { baseMainnetClient, sendSwapsRevenueSafeAddress } from '@my/wagmi'
import { TRPCError } from '@trpc/server'
import { hexToBytea } from 'app/utils/hexToBytea'
import { createSupabaseAdminClient } from 'app/utils/supabase/admin'
import { address } from 'app/utils/zod'
import { isAddress, isAddressEqual } from 'viem'
import { createTRPCRouter, protectedProcedure } from '../../trpc'
import debug from 'debug'
import { allCoinsDict } from 'app/data/coins'
import {
  type KyberEncodeRouteRequest,
  KyberEncodeRouteRequestSchema,
  KyberEncodeRouteResponseSchema,
  type KyberGetSwapRouteRequest,
  KyberGetSwapRouteRequestSchema,
  KyberGetSwapRouteResponseSchema,
  EstimateAmountInFromAmountOutRequestSchema,
} from './types'

const log = debug('api:routers:swap')

const CHAIN = 'base'
const SWAP_FEE = '75' // 0.75% feeAmount is the percentage of fees that we will take with base unit = 10000
const KYBER_NATIVE_TOKEN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE'

const getHeaders = () => {
  if (!process.env.NEXT_PUBLIC_KYBER_CLIENT_ID) {
    return undefined
  }

  return { 'x-client-id': process.env.NEXT_PUBLIC_KYBER_CLIENT_ID }
}

const adjustTokenIfNeed = (token: string) => {
  return token === 'eth' ? KYBER_NATIVE_TOKEN_ADDRESS : token
}

const fetchKyberSwapRoute = async ({ tokenIn, tokenOut, amountIn }: KyberGetSwapRouteRequest) => {
  try {
    const url = new URL(`${process.env.NEXT_PUBLIC_KYBER_SWAP_BASE_URL}/${CHAIN}/api/v1/routes`)
    url.searchParams.append('tokenIn', adjustTokenIfNeed(tokenIn))
    url.searchParams.append('tokenOut', adjustTokenIfNeed(tokenOut))
    url.searchParams.append('amountIn', amountIn)
    url.searchParams.append('feeAmount', SWAP_FEE)
    url.searchParams.append('chargeFeeBy', 'currency_out')
    url.searchParams.append('isInBps', 'true')
    url.searchParams.append('feeReceiver', sendSwapsRevenueSafeAddress[baseMainnetClient.chain.id])

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: getHeaders(),
    }).then((res) => res.json())

    const kyberGetSwapRouteResponse = KyberGetSwapRouteResponseSchema.parse(response)

    if (kyberGetSwapRouteResponse.code !== 0) {
      throw new Error(kyberGetSwapRouteResponse.message)
    }

    return {
      routeSummary: kyberGetSwapRouteResponse.data.routeSummary,
      routerAddress: kyberGetSwapRouteResponse.data.routerAddress,
    }
  } catch (error) {
    log('Error calling fetchKyberSwapRoute', error)
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to find swap route.',
    })
  }
}

const encodeKyberSwapRoute = async ({
  routeSummary,
  recipient,
  sender,
  slippageTolerance,
}: KyberEncodeRouteRequest) => {
  const supabaseAdmin = createSupabaseAdminClient()
  try {
    const url = `${process.env.NEXT_PUBLIC_KYBER_SWAP_BASE_URL}/${CHAIN}/api/v1/route/build`

    const liquidityPools = routeSummary.route
      .map((routeLiquidityPools) => {
        const [tokenInLiquidityPool] = routeLiquidityPools

        if (
          !tokenInLiquidityPool ||
          isAddressEqual(routeSummary.tokenIn, KYBER_NATIVE_TOKEN_ADDRESS)
        ) {
          return null
        }

        const result = address.safeParse(tokenInLiquidityPool.pool)

        // kyber can return contracts addresses (or custom values) instead of LP address (e.g. uniswap v4 hooks)
        // for now we gonna ignore those
        if (!result.success || !isAddress(tokenInLiquidityPool.pool)) {
          log('Not saving LP address: ', tokenInLiquidityPool.pool)
          return null
        }

        return {
          pool_addr: tokenInLiquidityPool.pool,
          pool_name: tokenInLiquidityPool.exchange,
          pool_type: tokenInLiquidityPool.poolType,
          chain_id: baseMainnetClient.chain.id,
        }
      })
      .filter((item) => item !== null)

    const { error: liquidityPoolsError } = await supabaseAdmin.from('liquidity_pools').upsert(
      liquidityPools.map((lp) => ({
        ...lp,
        pool_addr: hexToBytea(lp.pool_addr as `0x${string}`),
      })),
      { ignoreDuplicates: true }
    )

    if (liquidityPoolsError) {
      throw new Error(liquidityPoolsError.message)
    }

    const body = JSON.stringify({
      sender,
      recipient,
      slippageTolerance,
      routeSummary,
    })
    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body,
    }).then((res) => res.json())

    const kyberEncodeRouteResponse = KyberEncodeRouteResponseSchema.parse(response)

    if (kyberEncodeRouteResponse.code !== 0) {
      throw new Error(kyberEncodeRouteResponse.message)
    }

    const { error: swapRoutersError } = await supabaseAdmin.from('swap_routers').upsert(
      {
        router_addr: hexToBytea(kyberEncodeRouteResponse.data.routerAddress),
        chain_id: baseMainnetClient.chain.id,
      },
      { ignoreDuplicates: true }
    )

    if (swapRoutersError) {
      throw new Error(swapRoutersError.message)
    }

    return kyberEncodeRouteResponse.data
  } catch (error) {
    log('Error calling encodeKyberSwapRoute', error)
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Failed to encode swap route',
    })
  }
}

const getDecimalsFromCoins = (token: string) => {
  // Prefer coin registry (includes 'eth')
  const coin = (allCoinsDict as Record<string, { decimals?: number }>)[token]
  if (coin?.decimals !== undefined) return coin.decimals
  if (token === 'eth') return 18
  // Fallback: assume 18 if unknown (conservative default)
  log('decimals lookup fallback: assuming 18 for', token)
  return 18
}

export const swapRouter = createTRPCRouter({
  fetchSwapRoute: protectedProcedure
    .input(KyberGetSwapRouteRequestSchema)
    .query(async ({ input: { tokenIn, tokenOut, amountIn } }) => {
      log('calling fetchSwapRoute with input: ', { tokenIn, tokenOut, amountIn })
      return await fetchKyberSwapRoute({ tokenIn, tokenOut, amountIn })
    }),
  encodeSwapRoute: protectedProcedure
    .input(KyberEncodeRouteRequestSchema)
    .mutation(async ({ input: { routeSummary, slippageTolerance, sender, recipient } }) => {
      log('calling encodeSwapRoute with input: ', {
        routeSummary,
        slippageTolerance,
        sender,
        recipient,
      })
      return await encodeKyberSwapRoute({ routeSummary, slippageTolerance, sender, recipient })
    }),
  estimateAmountInFromAmountOut: protectedProcedure
    .input(EstimateAmountInFromAmountOutRequestSchema)
    .query(async ({ input: { tokenIn, tokenOut, amountOut } }) => {
      log('estimateAmountInFromAmountOut input', { tokenIn, tokenOut, amountOut })
      try {
        const desiredOut = BigInt(amountOut)
        if (desiredOut <= 0n) {
          throw new Error('Invalid amountOut')
        }
        const decimalsIn = getDecimalsFromCoins(tokenIn)
        const probeIn = BigInt(10) ** BigInt(decimalsIn)
        const probe = await fetchKyberSwapRoute({
          tokenIn,
          tokenOut,
          amountIn: probeIn.toString(),
        })
        const outProbe = BigInt(probe.routeSummary.amountOut || '0')
        if (outProbe === 0n) {
          throw new Error('Probe quote returned zero amountOut')
        }
        const estimatedAmountIn = (desiredOut * probeIn) / outProbe || 1n

        // Estimate USD values linearly from probe quote
        const inUsdProbe = Number(probe.routeSummary.amountInUsd || '0')
        const outUsdProbe = Number(probe.routeSummary.amountOutUsd || '0')
        const probeInNum = Number(probeIn)
        const outProbeNum = Number(outProbe)
        const estimatedAmountInNum = Number(estimatedAmountIn)
        const desiredOutNum = Number(desiredOut)

        const amountInUsd = probeInNum > 0 ? (inUsdProbe / probeInNum) * estimatedAmountInNum : 0
        const amountOutUsd = outProbeNum > 0 ? (outUsdProbe / outProbeNum) * desiredOutNum : 0

        log('estimateAmountInFromAmountOut result', {
          decimalsIn,
          probeIn: probeIn.toString(),
          outProbe: outProbe.toString(),
          desiredOut: desiredOut.toString(),
          estimatedAmountIn: estimatedAmountIn.toString(),
          amountInUsd: amountInUsd.toFixed(6),
          amountOutUsd: amountOutUsd.toFixed(6),
        })
        return {
          estimatedAmountIn: estimatedAmountIn.toString(),
          amountInUsd: amountInUsd.toFixed(6),
          amountOutUsd: amountOutUsd.toFixed(6),
        }
      } catch (error) {
        log('Error in estimateAmountInFromAmountOut', error)
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to estimate amountIn.',
        })
      }
    }),
})
