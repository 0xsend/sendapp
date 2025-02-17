import type {
  leaderboard_referrals_all_timeInputs,
  SeedClientOptions,
  usersInputs,
  Store,
} from '@snaplet/seed'
import { pravatar, tagName } from './utils'
import { generatePrivateKey, privateKeyToAddress } from 'viem/accounts'
import { copycat } from '@snaplet/copycat'
import crypto from 'node:crypto'
import debug from 'debug'

const log = debug('snaplet:models')

interface SeedContext {
  seed: {
    tags: Array<{ id: number }>
    send_accounts: Array<{ id: string }>
  }
  store: Store
}

export const models: SeedClientOptions['models'] = {
  users: {
    data: {
      phone: (ctx) => {
        return copycat
          .phoneNumber(ctx.seed, {
            length: {
              min: 7,
              max: 14,
            },
          })
          .replace('+', '')
      },
    },
  },
  profiles: {
    data: {
      name: (ctx) => copycat.fullName(ctx.seed),
      avatar_url: (ctx) => pravatar(copycat.fullName(ctx.seed)),
      x_username: (ctx) => copycat.username(ctx.seed, { limit: 64 }),
      send_id: (ctx) => copycat.int(ctx.seed, { min: 10000, max: 99999 }),
    },
  },
  tags: {
    data: {
      id: (ctx) => {
        const parallelIndex = process.env.TEST_PARALLEL_INDEX || '0'
        return (
          1000 + Number.parseInt(parallelIndex) * 1000 + copycat.int(ctx.seed, { min: 0, max: 999 })
        )
      },
      name: (ctx) => {
        const uniqueId = crypto.randomBytes(2).toString('hex')
        return `tag${uniqueId}`.toLowerCase()
      },
      status: 'confirmed',
    },
  },
  send_accounts: {
    data: {
      address: () => privateKeyToAddress(generatePrivateKey()),
      chain_id: 845337,
    },
  },
  send_account_tags: {
    data: {
      tag_id: (ctx) => {
        const tag = ctx.store.tags[0]
        if (!tag?.id) throw new Error('No tag found')
        return tag.id
      },
      send_account_id: (ctx) => {
        const account = ctx.store.send_accounts[0]
        if (!account?.id) throw new Error('No send_account found')
        return account.id
      },
    },
  },
  chain_addresses: {
    data: {
      address: () => privateKeyToAddress(generatePrivateKey()),
    },
  },
}

export const leaderboardReferralsAllTimes: leaderboard_referrals_all_timeInputs = {
  rewards_usdc: (ctx) => copycat.int(ctx.seed, { min: 0, max: 100_000_000 }),
  referrals: (ctx) => copycat.int(ctx.seed, { min: 0, max: 100_000_000 }),
}

export const userOnboarded: usersInputs = {
  phone: (ctx) => {
    const phone = copycat.phoneNumber(ctx.seed, {
      length: {
        min: 7,
        max: 15,
      },
    })
    return phone.replace('+', '')
  },
  send_accounts: [
    {
      chain_id: 845337,
    },
  ],
  tags: [{}],
  profiles: [
    {
      referral_code: (ctx) => crypto.randomBytes(8).toString('hex'),
      x_username: null,
      is_public: true,
      name: (ctx) => copycat.fullName(ctx.seed),
      about: (ctx) => copycat.sentence(ctx.seed),
      send_id: (ctx) => copycat.int(ctx.seed, { min: 10000, max: 99999 }),
    },
  ],
  chain_addresses: [{}],
}
