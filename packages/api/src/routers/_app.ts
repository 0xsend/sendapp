import { inferRouterInputs, inferRouterOutputs } from '@trpc/server'
import { createTRPCRouter } from '../trpc'
import { chainAddressRouter } from './chainAddress'
import { tagRouter } from './tag'
import { authRouter } from './auth'
import { distributionRouter } from './distribution'

export const appRouter = createTRPCRouter({
  chainAddress: chainAddressRouter,
  tag: tagRouter,
  auth: authRouter,
  distribution: distributionRouter,
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
