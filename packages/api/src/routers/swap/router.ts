import { createTRPCRouter, protectedProcedure } from '../../trpc'
import {
  type KyberEncodeRouteRequest,
  KyberEncodeRouteRequestSchema,
  KyberEncodeRouteResponseSchema,
  type KyberGetSwapRouteRequest,
  KyberGetSwapRouteRequestSchema,
  KyberGetSwapRouteResponseSchema,
} from './types'
import debug from 'debug'
import { baseMainnetClient, sendSwapsRevenueSafeAddress } from '@my/wagmi'
import { TRPCError } from '@trpc/server'
import { supabaseAdmin } from 'app/utils/supabase/admin'
import { isAddressEqual } from 'viem'

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

        return {
          pool_addr: tokenInLiquidityPool.pool,
          pool_name: tokenInLiquidityPool.exchange,
          pool_type: tokenInLiquidityPool.poolType,
          chain_id: baseMainnetClient.chain.id,
        }
      })
      .filter((item) => item !== null)

    const { error: liquidityPoolsError } = await supabaseAdmin
      .from('liquidity_pools')
      .upsert(liquidityPools, { ignoreDuplicates: true })

    if (liquidityPoolsError) {
      throw new Error(liquidityPoolsError.message)
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        sender,
        recipient,
        slippageTolerance,
        routeSummary,
      }),
    }).then((res) => res.json())

    const kyberEncodeRouteResponse = KyberEncodeRouteResponseSchema.parse(response)

    if (kyberEncodeRouteResponse.code !== 0) {
      throw new Error(kyberEncodeRouteResponse.message)
    }

    const { error: swapRoutersError } = await supabaseAdmin.from('swap_routers').upsert(
      {
        router_addr: kyberEncodeRouteResponse.data.routerAddress,
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
})
