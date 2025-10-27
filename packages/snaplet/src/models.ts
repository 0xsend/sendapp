import { copycat } from '@snaplet/copycat'
import type {
  leaderboard_referrals_all_timeInputs,
  SeedClient,
  SeedClientOptions,
  usersInputs,
} from '@snaplet/seed'
import crypto from 'node:crypto'
import { hexToBytes } from 'viem'
import { generatePrivateKey, privateKeyToAddress } from 'viem/accounts'
import { pravatar, tagName } from './utils'

// Store for generating consistent address and address_bytes pairs
let lastGeneratedAddress: string | null = null

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
      name: (ctx) => {
        // Generate a valid tag name (alphanumeric + underscore, max 20 chars)
        // Use nano timestamp + random suffix to ensure uniqueness
        const username = copycat.username(ctx.seed, { limit: 6 })
        const nanoTime = process.hrtime.bigint().toString(36).slice(-6)
        const randomSuffix = Math.random().toString(36).substring(2, 4)
        return tagName(`${username}_${nanoTime}${randomSuffix}`).toLowerCase().substring(0, 20)
      },
      status: 'confirmed',
    },
  },
  send_accounts: {
    data: {
      address: () => {
        const address = privateKeyToAddress(generatePrivateKey())
        lastGeneratedAddress = address
        return address
      },
      chain_id: 845337,
      init_code: () => Buffer.from(crypto.randomBytes(32)),
      address_bytes: () => {
        // Compute address_bytes from the last generated address
        if (!lastGeneratedAddress) return null

        // Match the database logic: decode(replace(address::text,'0x',''),'hex')
        if (lastGeneratedAddress.match(/^0x[A-Fa-f0-9]{40}$/)) {
          return Buffer.from(lastGeneratedAddress.replace('0x', ''), 'hex')
        }
        return null
      },
    },
  },
  send_account_tags: {
    data: {
      tag_id: (ctx) => {
        // Get the first (and only) tag for this user
        const tags = ctx.store.tags
        if (!tags || tags.length === 0) throw new Error('No tags found')
        const tag = tags[0]
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
      f: () => Buffer.from(hexToBytes(generatePrivateKey())),
      t: () => Buffer.from(hexToBytes(generatePrivateKey())),
      v: (ctx) => copycat.int(ctx.seed, { min: 0, max: 100_000_000 }),
    },
  },
  sendpot_jackpot_runs: {
    data: {
      src_name: 'base_logs',
      ig_name: 'sendpot_jackpot_runs',
      chain_id: 854337,
      abi_idx: (ctx) => copycat.int(ctx.seed, { min: 0, max: 1000 }),
      tx_idx: (ctx) => copycat.int(ctx.seed, { min: 0, max: 1000 }),
      log_idx: (ctx) => copycat.int(ctx.seed, { min: 0, max: 1000 }),
      block_num: (ctx) => copycat.int(ctx.seed, { min: 100, max: 1000 }),
      block_time: Math.floor(Date.now() / 1000),
      time: Math.floor(Date.now() / 1000),
      tx_hash: () => Buffer.from(hexToBytes(generatePrivateKey())),
      log_addr: () => Buffer.from(hexToBytes('0x0a0a5611b9a1071a1d8a308882065c48650baee8b')),
    },
  },
  sendpot_user_ticket_purchases: {
    data: {
      src_name: 'base_logs',
      ig_name: 'sendpot_user_ticket_purchases',
      chain_id: 854337,
      abi_idx: (ctx) => copycat.int(ctx.seed, { min: 0, max: 1000 }),
      tx_idx: (ctx) => copycat.int(ctx.seed, { min: 0, max: 100 }),
      log_idx: (ctx) => copycat.int(ctx.seed, { min: 0, max: 1000 }),
      block_num: (ctx) => copycat.int(ctx.seed, { min: 50, max: 500 }),
      block_time: Math.floor(Date.now() / 1000),
      tx_hash: () => Buffer.from(hexToBytes(generatePrivateKey())),
      log_addr: () => Buffer.from(hexToBytes('0x0a0a5611b9a1071a1d8a308882065c48650baee8b')),
      referrer: () => Buffer.from(hexToBytes('0x0000000000000000000000000000000000000000')),
      tickets_purchased_total_bps: (ctx) => copycat.int(ctx.seed, { min: 10000, max: 50000 }),
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
        const username = copycat.username(ctx.seed, { limit: 6 })
        const nanoTime = process.hrtime.bigint().toString(36).slice(-6)
        const randomSuffix = Math.random().toString(36).substring(2, 4)
        return tagName(`${username}_${nanoTime}${randomSuffix}`).toLowerCase().substring(0, 20)
      },
      status: 'confirmed',
    },
  ],
  send_accounts: [
    {
      send_account_tags: (x) => x(1), // Match the number of tags created (1)
    },
  ],
  profiles: [
    {
      referral_code: () => crypto.randomBytes(8).toString('hex'),
      x_username: null,
      is_public: true,
      name: (ctx) => copycat.fullName(ctx.seed),
      about: (ctx) => copycat.sentence(ctx.seed),
      send_id: (ctx) => copycat.int(ctx.seed, { min: 10000, max: 99999 }),
    },
  ],
  chain_addresses: [{}],
}

/**
 * Creates a user input config with specified number of confirmed tags
 * @param tagCount Number of confirmed tags to create (0-5)
 * @param tagNames Optional specific tag names to use (must match tagCount length)
 * @returns usersInputs configuration
 */
export const createUserWithConfirmedTags = (tagCount = 1, tagNames?: string[]): usersInputs => {
  if (tagCount < 0 || tagCount > 5) {
    throw new Error('Tag count must be between 0 and 5')
  }

  if (tagNames && tagNames.length !== tagCount) {
    throw new Error(`tagNames length (${tagNames.length}) must match tagCount (${tagCount})`)
  }

  const tags = Array.from({ length: tagCount }, (_, index) => ({
    name: tagNames
      ? tagNames[index]
      : (ctx: { seed: string }) => {
          const username = copycat.username(ctx.seed + index, { limit: 6 })
          const nanoTime = process.hrtime.bigint().toString(36).slice(-6)
          const randomSuffix = Math.random().toString(36).substring(2, 4)
          return tagName(`${username}_${nanoTime}${randomSuffix}`).toLowerCase().substring(0, 20)
        },
    status: 'confirmed' as const,
  }))

  return {
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
    tags,
    send_accounts: [
      {
        send_account_tags: (x) => x(tagCount), // Match the number of tags created
      },
    ],
    profiles: [
      {
        referral_code: () => crypto.randomBytes(8).toString('hex'),
        x_username: null,
        is_public: true,
        name: (ctx) => copycat.fullName(ctx.seed),
        about: (ctx) => copycat.sentence(ctx.seed),
        send_id: (ctx) => copycat.int(ctx.seed, { min: 10000, max: 99999 }),
      },
    ],
    chain_addresses: [{}],
  }
}

/**
 * Creates a user with tags and send account tags using the seed client
 * @param seed SeedClient instance
 * @param options Configuration options for user creation
 * @returns Promise with created user data
 */
export const createUserWithTagsAndAccounts = async (
  seed: SeedClient,
  options: {
    tagCount?: number
    tagNames?: string[]
    referralCode?: string
    isPublic?: boolean
  } = {}
) => {
  const { tagCount = 1, tagNames, referralCode, isPublic = true } = options

  const userConfig = createUserWithConfirmedTags(tagCount, tagNames)

  // Override profile settings if provided
  if (referralCode !== undefined || isPublic !== undefined) {
    const existingProfile = userConfig.profiles?.[0] || {}
    userConfig.profiles = [
      {
        ...existingProfile,
        ...(referralCode !== undefined && { referral_code: referralCode }),
        ...(isPublic !== undefined && { is_public: isPublic }),
      },
    ]
  }

  const plan = await seed.users([userConfig])

  if (!plan.users[0] || !plan.profiles[0] || !plan.send_accounts[0]) {
    throw new Error('Failed to create user with tags and accounts')
  }

  return {
    user: plan.users[0],
    profile: plan.profiles[0],
    tags: plan.tags,
    sendAccount: plan.send_accounts[0],
    sendAccountTags: plan.send_account_tags,
    chainAddresses: plan.chain_addresses,
  }
}

/**
 * Creates multiple users with confirmed tags and send account tags
 * @param seed SeedClient instance
 * @param users Array of user configurations
 * @returns Promise with array of created user data
 */
export const createMultipleUsersWithTags = async (
  seed: SeedClient,
  users: Array<{
    tagCount?: number
    tagNames?: string[]
    referralCode?: string
    isPublic?: boolean
  }>
) => {
  const userConfigs = users.map((user) => createUserWithConfirmedTags(user.tagCount, user.tagNames))

  // Apply custom profile settings
  for (let index = 0; index < users.length; index++) {
    const user = users[index]
    if (!user || (user.referralCode === undefined && user.isPublic === undefined)) {
      continue
    }

    const config = userConfigs[index]
    if (!config) continue

    const existingProfile = config.profiles?.[0] || {}
    config.profiles = [
      {
        ...existingProfile,
        ...(user.referralCode !== undefined && { referral_code: user.referralCode }),
        ...(user.isPublic !== undefined && { is_public: user.isPublic }),
      },
    ]
  }

  const plan = await seed.users(userConfigs)

  return users.map((_, index) => {
    const user = plan.users[index]
    const sendAccount = plan.send_accounts[index]
    const profile = plan.profiles[index]

    if (!user || !sendAccount || !profile) {
      throw new Error(`Failed to create user ${index}`)
    }

    return {
      user,
      profile,
      tags: plan.tags.filter((tag) => tag.user_id === user.id),
      sendAccount,
      sendAccountTags: plan.send_account_tags.filter(
        (sat) => sat.send_account_id === sendAccount.id
      ),
      chainAddresses: plan.chain_addresses.filter((_, caIndex) => caIndex === index),
    }
  })
}

/**
 * Creates a user without any tags (for testing send ID functionality)
 * @param seed SeedClient instance
 * @param options Configuration options for user creation
 * @returns Promise with created user data
 */
export const createUserWithoutTags = async (
  seed: SeedClient,
  options: {
    referralCode?: string
    isPublic?: boolean
  } = {}
) => {
  const { referralCode, isPublic = true } = options

  const userConfig: usersInputs = {
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
    tags: [], // No tags
    send_accounts: [{}], // Create send account without tags
    profiles: [
      {
        referral_code: referralCode || (() => crypto.randomBytes(8).toString('hex')),
        x_username: null,
        is_public: isPublic,
        name: (ctx) => copycat.fullName(ctx.seed),
        about: (ctx) => copycat.sentence(ctx.seed),
        send_id: (ctx) => copycat.int(ctx.seed, { min: 10000, max: 99999 }),
      },
    ],
    chain_addresses: [{}],
  }

  const plan = await seed.users([userConfig])

  if (!plan.users[0] || !plan.profiles[0] || !plan.send_accounts[0]) {
    throw new Error('Failed to create user without tags')
  }

  return {
    user: plan.users[0],
    profile: plan.profiles[0],
    tags: plan.tags, // Will be empty
    sendAccount: plan.send_accounts[0],
    sendAccountTags: plan.send_account_tags, // Will be empty
    chainAddresses: plan.chain_addresses,
  }
}
