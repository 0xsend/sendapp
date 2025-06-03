import { copycat, faker } from '@snaplet/copycat'
import type {
  leaderboard_referrals_all_timeInputs,
  SeedClientOptions,
  usersInputs,
  Store,
} from '@snaplet/seed'
import crypto from 'node:crypto'
import { hexToBytes } from 'viem'
import { generatePrivateKey, privateKeyToAddress } from 'viem/accounts'
import { pravatar, tagName } from './utils'

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
        // Generate a valid tag name (alphanumeric + underscore, max 20 chars)
        const username = copycat.username(ctx.seed, { limit: 16 })
        return tagName(username).toLowerCase().substring(0, 20)
      },
      status: 'confirmed',
    },
  },
  send_accounts: {
    data: {
      address: () => privateKeyToAddress(generatePrivateKey()),
      chain_id: 845337,
      init_code: () => Buffer.from(crypto.randomBytes(32)),
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
  public_send_account_transfers: {
    data: {
      src_name: 'base_logs',
      ig_name: 'send_account_transfers',
      chain_id: 845337,
      abi_idx: (ctx) => copycat.int(ctx.seed, { min: 0, max: 1000 }),
      tx_idx: (ctx) => copycat.int(ctx.seed, { min: 0, max: 1000 }),
      log_idx: (ctx) => copycat.int(ctx.seed, { min: 0, max: 1000 }),
      block_num: (ctx) => copycat.int(ctx.seed, { min: 0, max: 100_000_000 }),
      block_time: Math.floor(new Date().getTime() / 1000),
      tx_hash: Buffer.from(hexToBytes(generatePrivateKey())),
      f: (ctx) => Buffer.from(hexToBytes(generatePrivateKey())),
      t: (ctx) => Buffer.from(hexToBytes(generatePrivateKey())),
      v: (ctx) => copycat.int(ctx.seed, { min: 0, max: 100_000_000 }),
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
  email: (ctx) => copycat.email(ctx.seed),
  tags: [
    {
      name: (ctx) => {
        const username = copycat.username(ctx.seed, { limit: 15 })
        return tagName(username).toLowerCase().substring(0, 20)
      },
      status: 'confirmed',
    },
    {
      name: (ctx) => {
        const username = copycat.username(ctx.seed, { limit: 12 })
        return `0x${tagName(username)}`.toLowerCase().substring(0, 20)
      },
      status: 'confirmed',
    },
  ],
  send_accounts: [
    {
      send_account_tags: (x) => x(3),
    },
  ],
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
