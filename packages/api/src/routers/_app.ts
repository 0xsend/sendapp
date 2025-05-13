import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'
import { createTRPCRouter } from '../trpc'
import { authRouter } from './auth/router'
import { chainAddressRouter } from './chainAddress'
import { distributionRouter } from './distribution'
import { tagRouter } from './tag/router'
import { secretShopRouter } from './secretShop'
import { sendAccountRouter } from './sendAccount'
import { sendEarnRouter } from './sendEarn'
import { temporalRouter } from './temporal'
import { accountRecoveryRouter } from './account-recovery/router'
import { swapRouter } from './swap/router'

export const appRouter = createTRPCRouter({
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
