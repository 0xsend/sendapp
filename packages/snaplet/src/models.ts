import { copycat } from '@snaplet/copycat'
import type {
  contactsInputs,
  contact_labelsInputs,
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

// Contact source types (must match contact_source_enum in database)
export type ContactSource = 'manual' | 'activity' | 'referral' | 'external'

// Chain types for external contacts
export type ChainType = 'evm' | 'solana' | 'canton'

// Chain ID prefixes
const CHAIN_PREFIXES = {
  evm: 'eip155:',
  solana: 'solana:',
  canton: 'canton:',
} as const

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
      // Use high ID range to avoid conflicts with app-generated tags
      id: (ctx) => copycat.int(ctx.seed, { min: 1_000_000, max: 9_999_999 }),
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
      // Use high ID range to avoid conflicts with app-generated send_account_tags
      id: (ctx) => copycat.int(ctx.seed, { min: 1_000_000, max: 9_999_999 }),
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
  contacts: {
    data: {
      // Note: contact_user_id, external_address, chain_id are NOT set here
      // to allow factory functions to provide them. Snaplet would otherwise
      // override input values with these defaults.
      custom_name: (ctx) => copycat.fullName(ctx.seed).slice(0, 80),
      notes: (ctx) => copycat.sentence(ctx.seed).slice(0, 500),
      is_favorite: (ctx) => copycat.bool(ctx.seed, { probability: 0.2 }),
      source: 'manual',
      last_interacted_at: () => new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
    },
  },
  contact_labels: {
    data: {
      name: (ctx) => {
        const word = copycat.word(ctx.seed)
        const nanoTime = process.hrtime.bigint().toString(36).slice(-4)
        return `${word}_${nanoTime}`.slice(0, 32)
      },
      color: (ctx) =>
        copycat.oneOfString(ctx.seed, [
          '#FF6B6B',
          '#4ECDC4',
          '#45B7D1',
          '#96CEB4',
          '#FFEAA7',
          '#DDA0DD',
          '#98D8C8',
          '#F7DC6F',
        ]),
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

// =============================================================================
// Contact Factory Functions
// =============================================================================

/**
 * Generates a deterministic hex string from a seed
 */
function deterministicHex(seed: string, length: number): string {
  const hexChars = '0123456789abcdef'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += hexChars[copycat.int(`${seed}-hex-${i}`, { min: 0, max: 15 })]
  }
  return result
}

/**
 * Generates a valid external address for a given chain type
 * All addresses are deterministic based on the seed
 */
export function generateExternalAddress(
  seed: string,
  chainType: ChainType
): { address: string; chainId: string } {
  switch (chainType) {
    case 'evm': {
      // EVM: 0x + 40 hex chars (deterministic)
      const hexPart = deterministicHex(`${seed}-evm`, 40)
      const chainNum = copycat.int(seed, { min: 1, max: 8453 })
      return { address: `0x${hexPart}`, chainId: `${CHAIN_PREFIXES.evm}${chainNum}` }
    }
    case 'solana': {
      // Solana: 32-44 base58 chars (alphanumeric, no 0, O, I, l)
      const base58Chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
      const length = copycat.int(`${seed}-len`, { min: 32, max: 44 })
      let address = ''
      for (let i = 0; i < length; i++) {
        address += base58Chars[copycat.int(`${seed}-${i}`, { min: 0, max: base58Chars.length - 1 })]
      }
      return { address, chainId: `${CHAIN_PREFIXES.solana}mainnet` }
    }
    case 'canton': {
      // Canton: party::hex format (at least 64 hex chars, deterministic)
      const partyName = copycat.word(seed).replace(/[^a-zA-Z0-9-]/g, '') || 'party'
      const hexPart = deterministicHex(`${seed}-canton`, 64)
      return { address: `${partyName}::${hexPart}`, chainId: `${CHAIN_PREFIXES.canton}global` }
    }
  }
}

/**
 * Options for creating a contact between Send users
 */
export interface CreateSendContactOptions {
  ownerId: string
  contactUserId: string
  source?: Exclude<ContactSource, 'external'>
  customName?: string | null
  notes?: string | null
  isFavorite?: boolean
  lastInteractedAt?: Date | null
  archivedAt?: Date | null
}

/**
 * Creates a contact input for a Send-to-Send user contact
 * Validates inputs to fail fast on constraint violations
 */
export function createSendContactInput(options: CreateSendContactOptions): contactsInputs {
  const {
    ownerId,
    contactUserId,
    source = 'manual',
    customName,
    notes,
    isFavorite = false,
    lastInteractedAt,
    archivedAt,
  } = options

  // Fail fast validations
  if (ownerId === contactUserId) {
    throw new Error('Cannot create self-contact: owner_id and contact_user_id must differ')
  }
  // Runtime validation for source (TypeScript enforces at compile time, but validate at runtime too)
  if ((source as string) === 'external') {
    throw new Error('Send user contacts cannot have source "external"')
  }
  if (customName && customName.length > 80) {
    throw new Error(`custom_name exceeds 80 chars: ${customName.length}`)
  }
  if (notes && notes.length > 500) {
    throw new Error(`notes exceeds 500 chars: ${notes.length}`)
  }

  return {
    owner_id: ownerId,
    contact_user_id: contactUserId,
    // Explicitly null external fields to prevent Snaplet auto-generation
    external_address: null,
    chain_id: null,
    source,
    custom_name: customName ?? null,
    notes: notes ?? null,
    is_favorite: isFavorite,
    last_interacted_at: lastInteractedAt ?? null,
    archived_at: archivedAt ?? null,
  }
}

/**
 * Options for creating an external address contact
 */
export interface CreateExternalContactOptions {
  ownerId: string
  address: string
  chainId: string
  customName?: string | null
  notes?: string | null
  isFavorite?: boolean
  lastInteractedAt?: Date | null
  archivedAt?: Date | null
}

/**
 * Creates a contact input for an external blockchain address
 * Validates address format based on chain type
 */
export function createExternalContactInput(options: CreateExternalContactOptions): contactsInputs {
  const {
    ownerId,
    address,
    chainId,
    customName,
    notes,
    isFavorite = false,
    lastInteractedAt,
    archivedAt,
  } = options

  // Fail fast validations
  if (customName && customName.length > 80) {
    throw new Error(`custom_name exceeds 80 chars: ${customName.length}`)
  }
  if (notes && notes.length > 500) {
    throw new Error(`notes exceeds 500 chars: ${notes.length}`)
  }

  // Validate chain_id and address format
  if (chainId.startsWith(CHAIN_PREFIXES.evm)) {
    if (!/^eip155:\d+$/.test(chainId)) {
      throw new Error(`Invalid EVM chain_id format: ${chainId}`)
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
      throw new Error(`Invalid EVM address format: ${address}`)
    }
  } else if (chainId.startsWith(CHAIN_PREFIXES.solana)) {
    if (!/^solana:[A-Za-z0-9]+$/.test(chainId)) {
      throw new Error(`Invalid Solana chain_id format: ${chainId}`)
    }
    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) {
      throw new Error(`Invalid Solana address format: ${address}`)
    }
  } else if (chainId.startsWith(CHAIN_PREFIXES.canton)) {
    if (!/^canton:[A-Za-z0-9-]+$/.test(chainId)) {
      throw new Error(`Invalid Canton chain_id format: ${chainId}`)
    }
    if (!/^[a-zA-Z0-9-]+::[0-9a-fA-F]{64,}$/.test(address)) {
      throw new Error(`Invalid Canton address format: ${address}`)
    }
  } else {
    throw new Error(`Unknown chain_id prefix: ${chainId}`)
  }

  return {
    owner_id: ownerId,
    // Explicitly null contact_user_id to prevent Snaplet auto-generation
    contact_user_id: null,
    external_address: address,
    chain_id: chainId,
    source: 'external',
    custom_name: customName ?? null,
    notes: notes ?? null,
    is_favorite: isFavorite,
    last_interacted_at: lastInteractedAt ?? null,
    archived_at: archivedAt ?? null,
  }
}

/**
 * Options for creating a contact label
 */
export interface CreateContactLabelOptions {
  ownerId: string
  name: string
  color?: string | null
}

/**
 * Creates a contact label input
 * Validates name length constraints
 */
export function createContactLabelInput(options: CreateContactLabelOptions): contact_labelsInputs {
  const { ownerId, name, color } = options

  // Fail fast validations
  if (name.length < 1) {
    throw new Error('Label name must be at least 1 character')
  }
  if (name.length > 32) {
    throw new Error(`Label name exceeds 32 chars: ${name.length}`)
  }

  return {
    owner_id: ownerId,
    name,
    color: color ?? null,
  }
}

/**
 * Configuration for seeding a contact network
 */
export interface SeedContactNetworkConfig {
  /** Distribution per user category */
  perUser: {
    /** Users with zero contacts */
    zero: number
    /** Users with 1-2 contacts (light) */
    light: number
    /** Users with 5-10 contacts (medium) */
    medium: number
    /** Users with 15-25 contacts (heavy) */
    heavy: number
  }
  /** Rate of external vs Send-user contacts (0-1) */
  externalRate: number
  /** Rate of favorites among contacts (0-1) */
  favoritesRate: number
  /** Rate of archived contacts (0-1) */
  archivedRate: number
  /** Distribution of sources for Send-user contacts */
  sources: {
    manual: number
    activity: number
    referral: number
  }
  /** Distribution of chain types for external contacts */
  chainDistribution: {
    evm: number
    solana: number
    canton: number
  }
  /** Number of labels to create per user (range) */
  labelsPerUser: { min: number; max: number }
  /** Rate of contacts that have labels assigned */
  labelAssignmentRate: number
  /** Base timestamp for deterministic date generation (defaults to Date.now()) */
  baseTime?: number
}

/**
 * Default configuration for seeding contact network
 * Based on recommendations: 80/20 Send-user vs external, 90/8/2 EVM/Solana/Canton
 */
export const DEFAULT_CONTACT_NETWORK_CONFIG: SeedContactNetworkConfig = {
  perUser: {
    zero: 10, // 10 users with no contacts
    light: 30, // 30 users with 1-2 contacts
    medium: 40, // 40 users with 5-10 contacts
    heavy: 23, // 23 users with 15-25 contacts (total 103)
  },
  externalRate: 0.2, // 20% external contacts
  favoritesRate: 0.15, // 15% favorites
  archivedRate: 0.05, // 5% archived
  sources: {
    manual: 0.6,
    activity: 0.3,
    referral: 0.1,
  },
  chainDistribution: {
    evm: 0.9,
    solana: 0.08,
    canton: 0.02,
  },
  labelsPerUser: { min: 0, max: 5 },
  labelAssignmentRate: 0.3,
}

/**
 * Generates contact network data for seeding
 * Returns arrays of contact inputs and label inputs ready for database insertion
 */
export function generateContactNetworkData(
  users: Array<{ id: string }>,
  config: SeedContactNetworkConfig = DEFAULT_CONTACT_NETWORK_CONFIG
): {
  contacts: contactsInputs[]
  labels: contact_labelsInputs[]
  labelAssignments: Array<{ contactIndex: number; labelIndex: number }>
} {
  const contacts: contactsInputs[] = []
  const labels: contact_labelsInputs[] = []
  const labelAssignments: Array<{ contactIndex: number; labelIndex: number }> = []

  // Use provided baseTime for deterministic timestamps, or fall back to Date.now()
  const baseTime = config.baseTime ?? Date.now()

  // Validate perUser counts against available users
  const { zero, light, medium, heavy } = config.perUser
  const totalRequested = zero + light + medium + heavy
  if (totalRequested > users.length) {
    console.warn(
      `perUser config requests ${totalRequested} users but only ${users.length} available. Categories will be truncated.`
    )
  }

  // Shuffle users for random assignment to categories
  const shuffledUsers = [...users].sort(
    (a, b) => copycat.int(a.id, { min: 0, max: 1000 }) - copycat.int(b.id, { min: 0, max: 1000 })
  )

  // Assign users to categories (clamped to available users)
  const zeroUsers = shuffledUsers.slice(0, Math.min(zero, shuffledUsers.length))
  const lightUsers = shuffledUsers.slice(
    zeroUsers.length,
    Math.min(zeroUsers.length + light, shuffledUsers.length)
  )
  const mediumUsers = shuffledUsers.slice(
    zeroUsers.length + lightUsers.length,
    Math.min(zeroUsers.length + lightUsers.length + medium, shuffledUsers.length)
  )
  const heavyUsers = shuffledUsers.slice(
    zeroUsers.length + lightUsers.length + mediumUsers.length,
    Math.min(
      zeroUsers.length + lightUsers.length + mediumUsers.length + heavy,
      shuffledUsers.length
    )
  )

  // Track labels per user for assignment
  const userLabelRanges: Map<string, { start: number; count: number }> = new Map()

  // Create labels for each user (except zero-contact users)
  const usersWithContacts = [...lightUsers, ...mediumUsers, ...heavyUsers]
  for (const user of usersWithContacts) {
    const labelCount = copycat.int(`${user.id}-labels`, {
      min: config.labelsPerUser.min,
      max: config.labelsPerUser.max,
    })

    const labelStart = labels.length
    for (let i = 0; i < labelCount; i++) {
      const labelSeed = `${user.id}-label-${i}`
      labels.push(
        createContactLabelInput({
          ownerId: user.id,
          name: `${copycat.word(labelSeed)}_${i}`.slice(0, 32),
          color: copycat.oneOfString(labelSeed, [
            '#FF6B6B',
            '#4ECDC4',
            '#45B7D1',
            '#96CEB4',
            '#FFEAA7',
            '#DDA0DD',
          ]),
        })
      )
    }
    userLabelRanges.set(user.id, { start: labelStart, count: labelCount })
  }

  // Helper to pick a weighted random source
  const pickSource = (seed: string): Exclude<ContactSource, 'external'> => {
    const rand = copycat.float(seed, { min: 0, max: 1 })
    if (rand < config.sources.manual) return 'manual'
    if (rand < config.sources.manual + config.sources.activity) return 'activity'
    return 'referral'
  }

  // Helper to pick a weighted random chain type
  const pickChainType = (seed: string): ChainType => {
    const rand = copycat.float(seed, { min: 0, max: 1 })
    if (rand < config.chainDistribution.evm) return 'evm'
    if (rand < config.chainDistribution.evm + config.chainDistribution.solana) return 'solana'
    return 'canton'
  }

  // Helper to create contacts for a user
  const createContactsForUser = (owner: { id: string }, contactCount: number) => {
    // Get potential contact targets (all other users), shuffled deterministically
    const potentialTargets = users
      .filter((u) => u.id !== owner.id)
      .sort(
        (a, b) =>
          copycat.int(`${owner.id}-shuffle-${a.id}`, { min: 0, max: 10000 }) -
          copycat.int(`${owner.id}-shuffle-${b.id}`, { min: 0, max: 10000 })
      )

    // Track used Send-user targets to prevent duplicates (external addresses are always unique)
    const usedTargets = new Set<string>()
    let targetIdx = 0

    for (let i = 0; i < contactCount; i++) {
      const contactSeed = `${owner.id}-contact-${i}`
      const isExternal = copycat.float(contactSeed, { min: 0, max: 1 }) < config.externalRate
      const isFavorite =
        copycat.float(`${contactSeed}-fav`, { min: 0, max: 1 }) < config.favoritesRate
      const isArchived =
        copycat.float(`${contactSeed}-arch`, { min: 0, max: 1 }) < config.archivedRate

      const contactIndex = contacts.length

      if (isExternal) {
        const chainType = pickChainType(`${contactSeed}-chain`)
        const { address, chainId } = generateExternalAddress(`${contactSeed}-addr`, chainType)
        contacts.push(
          createExternalContactInput({
            ownerId: owner.id,
            address,
            chainId,
            customName: copycat.bool(`${contactSeed}-name`, { probability: 0.7 })
              ? copycat.fullName(`${contactSeed}-name`).slice(0, 80)
              : null,
            notes: copycat.bool(`${contactSeed}-notes`, { probability: 0.3 })
              ? copycat.sentence(`${contactSeed}-notes`).slice(0, 500)
              : null,
            isFavorite,
            lastInteractedAt: copycat.bool(`${contactSeed}-interact`, { probability: 0.6 })
              ? new Date(
                  baseTime -
                    copycat.int(`${contactSeed}-time`, { min: 0, max: 30 * 24 * 60 * 60 * 1000 })
                )
              : null,
            archivedAt: isArchived ? new Date(baseTime) : null,
          })
        )
      } else {
        // Pick next unused target from shuffled list
        let currentTarget = potentialTargets[targetIdx]
        while (
          targetIdx < potentialTargets.length &&
          currentTarget &&
          usedTargets.has(currentTarget.id)
        ) {
          targetIdx++
          currentTarget = potentialTargets[targetIdx]
        }
        if (targetIdx >= potentialTargets.length || !currentTarget) {
          // No more unique targets available, skip this contact
          continue
        }

        const target = currentTarget
        usedTargets.add(target.id)
        targetIdx++

        contacts.push(
          createSendContactInput({
            ownerId: owner.id,
            contactUserId: target.id,
            source: pickSource(`${contactSeed}-source`),
            customName: copycat.bool(`${contactSeed}-name`, { probability: 0.5 })
              ? copycat.fullName(`${contactSeed}-name`).slice(0, 80)
              : null,
            notes: copycat.bool(`${contactSeed}-notes`, { probability: 0.2 })
              ? copycat.sentence(`${contactSeed}-notes`).slice(0, 500)
              : null,
            isFavorite,
            lastInteractedAt: copycat.bool(`${contactSeed}-interact`, { probability: 0.8 })
              ? new Date(
                  baseTime -
                    copycat.int(`${contactSeed}-time`, { min: 0, max: 30 * 24 * 60 * 60 * 1000 })
                )
              : null,
            archivedAt: isArchived ? new Date(baseTime) : null,
          })
        )
      }

      // Maybe assign labels to this contact
      const labelRange = userLabelRanges.get(owner.id)
      if (labelRange && labelRange.count > 0) {
        const shouldAssignLabel =
          copycat.float(`${contactSeed}-assign`, { min: 0, max: 1 }) < config.labelAssignmentRate
        if (shouldAssignLabel) {
          // Assign 1-3 labels
          const numLabels = copycat.int(`${contactSeed}-numlabels`, {
            min: 1,
            max: Math.min(3, labelRange.count),
          })
          const assignedLabels = new Set<number>()
          for (let j = 0; j < numLabels; j++) {
            const labelOffset = copycat.int(`${contactSeed}-label-${j}`, {
              min: 0,
              max: labelRange.count - 1,
            })
            const labelIndex = labelRange.start + labelOffset
            if (!assignedLabels.has(labelIndex)) {
              assignedLabels.add(labelIndex)
              labelAssignments.push({ contactIndex, labelIndex })
            }
          }
        }
      }
    }
  }

  // Create contacts for each category
  // Light users: 1-2 contacts
  for (const user of lightUsers) {
    const count = copycat.int(`${user.id}-count`, { min: 1, max: 2 })
    createContactsForUser(user, count)
  }

  // Medium users: 5-10 contacts
  for (const user of mediumUsers) {
    const count = copycat.int(`${user.id}-count`, { min: 5, max: 10 })
    createContactsForUser(user, count)
  }

  // Heavy users: 15-25 contacts
  for (const user of heavyUsers) {
    const count = copycat.int(`${user.id}-count`, { min: 15, max: 25 })
    createContactsForUser(user, count)
  }

  return { contacts, labels, labelAssignments }
}

/**
 * Seeds the contact network into the database
 * Creates contacts and labels. Label assignments are NOT inserted by this function
 * since they require the actual IDs from seeded records.
 *
 * @returns contactCount and labelCount reflect inserted records.
 *          labelAssignments is returned for the caller to insert via raw SQL
 *          using the actual IDs from the seeded records.
 */
export async function seedContactNetwork(
  seed: SeedClient,
  users: Array<{ id: string }>,
  config: SeedContactNetworkConfig = DEFAULT_CONTACT_NETWORK_CONFIG
): Promise<{
  contactCount: number
  labelCount: number
  labelAssignments: Array<{ contactIndex: number; labelIndex: number }>
}> {
  const { contacts, labels, labelAssignments } = generateContactNetworkData(users, config)

  // Seed labels first (they're referenced by assignments)
  const seededLabels =
    labels.length > 0 ? await seed.contact_labels(labels) : { contact_labels: [] }

  // Seed contacts
  const seededContacts = contacts.length > 0 ? await seed.contacts(contacts) : { contacts: [] }

  return {
    contactCount: seededContacts.contacts.length,
    labelCount: seededLabels.contact_labels.length,
    labelAssignments,
  }
}
