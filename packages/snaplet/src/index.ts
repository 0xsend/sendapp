import type { Store } from '@snaplet/seed'

export type { SeedClient, Store } from '@snaplet/seed'
export type StoreScalar<K extends keyof Store> = Store[K][number]

export { tagName } from './utils'
export * from './models'
export {
  createUserWithConfirmedTags,
  createUserWithTagsAndAccounts,
  createMultipleUsersWithTags,
} from './models'
