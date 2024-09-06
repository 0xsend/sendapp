import type {
  leaderboard_referrals_all_timeInputs,
  SeedClientOptions,
  usersInputs,
} from '@snaplet/seed'
import { pravatar, tagName } from './utils'
import { generatePrivateKey, privateKeyToAddress } from 'viem/accounts'
import { copycat } from '@snaplet/copycat'
import crypto from 'node:crypto'

export const models: SeedClientOptions['models'] = {
  users: {
    data: {
      phone: (ctx) => {
        return copycat
          .phoneNumber(ctx.seed, {
            length: {
              min: 7,
              max: 14, // max 15 including prefix
            },
          })
          .replace('+', '')
      },
    },
  },
  profiles: {
    data: {
      avatar_url: (ctx) => pravatar(copycat.fullName(ctx.seed)),
    },
  },
  tags: {
    data: {
      name: (ctx) => tagName(copycat.username(ctx.seed)),
    },
  },
  send_accounts: {
    data: {
      address: () => privateKeyToAddress(generatePrivateKey()),
      chain_id: 845337,
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
        max: 15, // max 15 including prefix
      },
    })
    return phone.replace('+', '')
  },
  profiles: [
    {
      referral_code: (ctx) => crypto.randomBytes(8).toString('hex'),
    },
  ],
  tags: [
    {
      status: 'confirmed',
    },
  ],
  send_accounts: [
    {
      chain_id: 845337,
    },
  ],
  chain_addresses: [{}],
}
