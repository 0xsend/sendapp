import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server'
import { createTRPCRouter } from '../trpc'
import { authRouter } from './auth/router'
import { chainAddressRouter } from './chainAddress'
import { distributionRouter } from './distribution'
import { tagRouter } from './tag'
import { secretShopRouter } from './secretShop'
import { sendAccountRouter } from './sendAccount'
import { transferRouter } from './transfer'
import { accountRecoveryRouter } from './account-recovery/router'
import { referralsRouter } from './referrals'

export const appRouter = createTRPCRouter({
  chainAddress: chainAddressRouter,
  tag: tagRouter,
  auth: authRouter,
  challenge: accountRecoveryRouter,
  distribution: distributionRouter,
  secretShop: secretShopRouter,
  sendAccount: sendAccountRouter,
  transfer: transferRouter,
  referrals: referralsRouter,
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
