import { copycat, faker } from '@snaplet/copycat'
import type {
  leaderboard_referrals_all_timeInputs,
  SeedClientOptions,
  usersInputs,
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
              max: 14, // max 15 including prefix
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
      // @ts-expect-error - thinks it's a number
      v: (ctx) => faker.number.bigInt({ min: 0, max: BigInt(100_000_000_000) }),
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
      x_username: null,
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
