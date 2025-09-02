import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'
import { createTRPCRouter } from '../trpc'
import { accountRecoveryRouter } from './account-recovery/router'
import { authRouter } from './auth/router'
import { chainAddressRouter } from './chainAddress'
import { distributionRouter } from './distribution'
import { secretShopRouter } from './secretShop'
import { sendAccountRouter } from './sendAccount'
import { sendEarnRouter } from './sendEarn'
import { swapRouter } from './swap/router'
import { tagRouter } from './tag/router'
import { temporalRouter } from './temporal'
import { onrampRouter } from './onramp/router'
import { coinGeckoRouter } from './coingecko/router'

// avoids error TS7056: The inferred type of this node exceeds the maximum length the compiler will serialize. An explicit type annotation is needed.
// Keep this in sync with the declared variable below
type AppRouterType = ReturnType<
  typeof createTRPCRouter<{
    chainAddress: typeof chainAddressRouter
    tag: typeof tagRouter
    auth: typeof authRouter
    challenge: typeof accountRecoveryRouter
    distribution: typeof distributionRouter
    secretShop: typeof secretShopRouter
    sendAccount: typeof sendAccountRouter
    sendEarn: typeof sendEarnRouter
    temporal: typeof temporalRouter
    swap: typeof swapRouter
    onramp: typeof onrampRouter
    coinGecko: typeof coinGeckoRouter
  }>
>
export const appRouter: AppRouterType = createTRPCRouter({
  chainAddress: chainAddressRouter,
  tag: tagRouter,
  auth: authRouter,
  challenge: accountRecoveryRouter,
  distribution: distributionRouter,
  secretShop: secretShopRouter,
  sendAccount: sendAccountRouter,
  sendEarn: sendEarnRouter,
  temporal: temporalRouter,
  swap: swapRouter,
  onramp: onrampRouter,
  coinGecko: coinGeckoRouter,
})

export type AppRouter = typeof appRouter

/**
 * Inference helpers for input types
 * @example type HelloInput = RouterInputs['example']['hello']
 **/
export type RouterInputs = inferRouterInputs<AppRouter>

/**
 * Inference helpers for output types
 * @example type HelloOutput = RouterOutputs['example']['hello']
 **/
export type RouterOutputs = inferRouterOutputs<AppRouter>
