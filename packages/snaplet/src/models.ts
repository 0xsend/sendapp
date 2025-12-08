import { copycat } from '@snaplet/copycat'
import type {
  leaderboard_referrals_all_timeInputs,
  SeedClient,
  SeedClientOptions,
  send_token_transfersInputs,
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
  distributions: {
    data: {
      number: (ctx) => copycat.int(ctx.seed, { min: 1, max: 100 }),
      name: (ctx) => `Distribution #${copycat.int(ctx.seed, { min: 1, max: 100 })}`,
      description: (ctx) => 'Distribution of 3,000,000 SEND tokens to early hodlers',
      amount: 3000000000000000000000000, // 3,000,000 SEND (18 decimals)
      hodler_pool_bips: 10000, // 100%
      bonus_pool_bips: 0,
      fixed_pool_bips: 10000, // 100%
      qualification_start: () => {
        // Start of current month
        const now = new Date()
        return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
      },
      qualification_end: () => {
        // End of current month (last second)
        const now = new Date()
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0)
        return new Date(nextMonth.getTime() - 1000) // 1 second before next month
      },
      claim_end: 'infinity',
      hodler_min_balance: 1000000000000000000000, // 1,000 SEND (18 decimals)
      earn_min_balance: 5000000, // 5 USDC (6 decimals)
      chain_id: 8453, // Base mainnet
      merkle_drop_addr: () => Buffer.from(hexToBytes('0x2c1630cd8f40d0458b7b5849e6cc2904a7d18a57')),
      token_addr: () => Buffer.from(hexToBytes('0xEab49138BA2Ea6dd776220fE26b7b8E446638956')),
      token_decimals: 18,
      tranche_id: (ctx) => {
        // tranche_id is typically distribution number - 7 (based on migration pattern)
        const distNum = copycat.int(ctx.seed, { min: 1, max: 100 })
        return Math.max(1, distNum - 7)
      },
      snapshot_block_num: null,
      sendpot_ticket_increment: 10,
    },
  },
  send_token_transfers: {
    data: {
      src_name: 'base_logs',
      ig_name: 'send_token_transfers',
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
 * Helper to create a distribution config for the old token era (pre-distribution 11)
 * @param config Distribution configuration
 * @returns Distribution input config
 */
export const createOldTokenDistribution = (config: {
  number: number
  name?: string
  description?: string
  amount: number // No decimals for old token
  hodler_pool_bips?: number
  bonus_pool_bips?: number
  fixed_pool_bips?: number
  qualification_start: Date
  qualification_end: Date
  claim_end?: Date | 'infinity'
  hodler_min_balance: number
  tranche_id: number
}) => ({
  number: config.number,
  name: config.name || `Distribution #${config.number}`,
  description: config.description || 'Distribution of tokens to early hodlers',
  amount: config.amount,
  hodler_pool_bips: config.hodler_pool_bips ?? 10000,
  bonus_pool_bips: config.bonus_pool_bips ?? 0,
  fixed_pool_bips: config.fixed_pool_bips ?? 10000,
  qualification_start: config.qualification_start,
  qualification_end: config.qualification_end,
  claim_end: config.claim_end || 'infinity',
  hodler_min_balance: config.hodler_min_balance,
  earn_min_balance: 0,
  chain_id: 845337,
  merkle_drop_addr: Buffer.from(hexToBytes('0x614f5273fdb63c1e1972fe1457ce77df1ca440a6')),
  token_addr: Buffer.from(hexToBytes('0x3f14920c99beb920afa163031c4e47a3e03b3e4a')),
  token_decimals: 0,
  tranche_id: config.tranche_id,
  snapshot_block_num: null,
  sendpot_ticket_increment: 10,
})

/**
 * Helper to create a distribution config for the new token era (distribution 11+)
 * @param config Distribution configuration
 * @returns Distribution input config
 */
export const createNewTokenDistribution = (config: {
  number: number
  name?: string
  description?: string
  amount: number // With 18 decimals
  hodler_pool_bips?: number
  bonus_pool_bips?: number
  fixed_pool_bips?: number
  qualification_start: Date
  qualification_end: Date
  claim_end?: Date | 'infinity'
  hodler_min_balance: number
  earn_min_balance?: number
  tranche_id: number
}) => ({
  number: config.number,
  name: config.name || `Distribution #${config.number}`,
  description: config.description || 'Distribution of 3,000,000 SEND tokens to early hodlers',
  amount: config.amount,
  hodler_pool_bips: config.hodler_pool_bips ?? 10000,
  bonus_pool_bips: config.bonus_pool_bips ?? 0,
  fixed_pool_bips: config.fixed_pool_bips ?? 10000,
  qualification_start: config.qualification_start,
  qualification_end: config.qualification_end,
  claim_end: config.claim_end || 'infinity',
  hodler_min_balance: config.hodler_min_balance,
  earn_min_balance: config.earn_min_balance ?? 0,
  chain_id: 845337,
  merkle_drop_addr: Buffer.from(hexToBytes('0x2c1630cd8f40d0458b7b5849e6cc2904a7d18a57')),
  token_addr: Buffer.from(hexToBytes('0xEab49138BA2Ea6dd776220fE26b7b8E446638956')),
  token_decimals: 18,
  tranche_id: config.tranche_id,
  snapshot_block_num: null,
  sendpot_ticket_increment: 10,
})

/**
 * Helper to create send_token_transfers within a distribution's qualification period
 * @param config Transfer configuration
 * @returns send_token_transfers input config
 */
export const createTransferInDistribution = (config: {
  from_address_bytes: Buffer
  to_address_bytes: Buffer
  amount: number
  distribution_start_epoch: number
  distribution_end_epoch: number
  offset_from_start_seconds?: number // Optional offset from distribution start
}): send_token_transfersInputs => {
  const block_time = config.offset_from_start_seconds
    ? config.distribution_start_epoch + config.offset_from_start_seconds
    : config.distribution_start_epoch +
      copycat.int(
        `${config.from_address_bytes.toString('hex')}-${config.to_address_bytes.toString('hex')}`,
        {
          min: 0,
          max: config.distribution_end_epoch - config.distribution_start_epoch,
        }
      )

  // Use block_time as seed for tx-specific random values to ensure determinism
  const txSeed = `${block_time}-${config.from_address_bytes.toString('hex')}`

  return {
    src_name: 'base_logs',
    ig_name: 'send_token_transfers',
    chain_id: 845337,
    log_addr: Buffer.from(hexToBytes('0xEab49138BA2Ea6dd776220fE26b7b8E446638956')), // SEND token address
    block_time,
    tx_hash: Buffer.from(hexToBytes(generatePrivateKey())),
    f: config.from_address_bytes,
    t: config.to_address_bytes,
    v: config.amount,
    block_num: Math.floor(block_time / 12), // Approximate block number (12 sec blocks)
    tx_idx: copycat.int(`${txSeed}-tx`, { min: 0, max: 99 }),
    log_idx: copycat.int(`${txSeed}-log`, { min: 0, max: 9 }),
    abi_idx: 0,
  }
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
