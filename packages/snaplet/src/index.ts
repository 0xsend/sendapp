import type { Store } from '@snaplet/seed'

export type { SeedClient, Store } from '@snaplet/seed'
export type StoreScalar<K extends keyof Store> = Store[K][number]

export { tagName } from './utils'
export { models } from './models'
