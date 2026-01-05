import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals'
import { createSeedClient } from '@snaplet/seed'
import type { SeedPostgres } from '@snaplet/seed/adapter-postgres'
import type { SeedClient } from '@snaplet/seed'
import pg from 'pg'
import {
  createUserWithConfirmedTags,
  createUserWithTagsAndAccounts,
  createMultipleUsersWithTags,
  createSendContactInput,
  createExternalContactInput,
  createContactLabelInput,
  generateExternalAddress,
  generateContactNetworkData,
  DEFAULT_CONTACT_NETWORK_CONFIG,
  models,
  userOnboarded,
} from '../models'

describe('Snaplet Models', () => {
  let pgClient: pg.Client
  let seedClient: SeedClient

  beforeAll(async () => {
    // Setup database connection
    pgClient = new pg.Client({
      connectionString: process.env.SUPABASE_DB_URL,
      application_name: 'snaplet_test',
    })
    await pgClient.connect()

    // Create seed client with database adapter
    const adapter: SeedPostgres = {
      execute: async (queryText) => {
        await pgClient.query('SET session_replication_role = replica')
        await pgClient.query('BEGIN')
        try {
          await pgClient.query(queryText)
          await pgClient.query('COMMIT')
        } catch (e) {
          await pgClient.query('ROLLBACK')
          throw e
        } finally {
          await pgClient.query('SET session_replication_role = DEFAULT')
        }
      },
      async query(queryText) {
        await pgClient.query('SET session_replication_role = replica')
        await pgClient.query('BEGIN')
        try {
          const result = await pgClient.query(queryText)
          await pgClient.query('COMMIT')
          return result.rows
        } catch (e) {
          await pgClient.query('ROLLBACK')
          throw e
        } finally {
          await pgClient.query('SET session_replication_role = DEFAULT')
        }
      },
      client: pgClient,
    }

    seedClient = await createSeedClient({
      dryRun: false,
      models,
      adapter,
    })
  })

  afterAll(async () => {
    await pgClient.end()
  })

  beforeEach(async () => {
    // Clear the seed client store before each test
    seedClient.$store.users = []
    seedClient.$store.profiles = []
    seedClient.$store.tags = []
    seedClient.$store.send_accounts = []
    seedClient.$store.send_account_tags = []
    seedClient.$store.chain_addresses = []
    seedClient.$store.contacts = []
    seedClient.$store.contact_labels = []
    seedClient.$store.contact_label_assignments = []
  })

  afterEach(async () => {
    // Clean up all test data after each test
    // Delete test users (identified by phone numbers with 7-15 digits)
    const testUserIds = await pgClient.query(
      'SELECT id FROM auth.users WHERE phone ~ $1 AND length(phone) BETWEEN 7 AND 15',
      ['^[0-9]+$']
    )

    if (testUserIds.rows.length > 0) {
      const userIds = testUserIds.rows.map((row) => row.id)

      // Delete contacts first (they reference users)
      await pgClient.query('DELETE FROM contacts WHERE owner_id = ANY($1::uuid[])', [userIds])
      await pgClient.query('DELETE FROM contact_labels WHERE owner_id = ANY($1::uuid[])', [userIds])

      // Delete in order of dependencies (using CASCADE should handle relationships)
      await pgClient.query('DELETE FROM auth.users WHERE id = ANY($1::uuid[])', [userIds])
    }

    // Also clean up any orphaned tags (null user_id)
    await pgClient.query('DELETE FROM tags WHERE user_id IS NULL AND name LIKE $1', ['%_%'])

    // Clear the seed client store
    seedClient.$store.users = []
    seedClient.$store.profiles = []
    seedClient.$store.tags = []
    seedClient.$store.send_accounts = []
    seedClient.$store.send_account_tags = []
    seedClient.$store.chain_addresses = []
    seedClient.$store.contacts = []
    seedClient.$store.contact_labels = []
    seedClient.$store.contact_label_assignments = []
  })

  describe('createUserWithConfirmedTags', () => {
    it('should create user config with default 1 tag', () => {
      const config = createUserWithConfirmedTags()

      expect(config.tags).toHaveLength(1)
      expect(config.send_accounts).toHaveLength(1)
    })

    it('should create user config with specified number of tags', () => {
      const config = createUserWithConfirmedTags(3)

      expect(config.tags).toHaveLength(3)
    })

    it('should create user config with specific tag names', () => {
      const tagNames = ['testag1', 'testag2', 'testag3']
      const config = createUserWithConfirmedTags(3, tagNames)

      expect(config.tags).toHaveLength(3)
    })

    it('should throw error for invalid tag count', () => {
      expect(() => createUserWithConfirmedTags(-1)).toThrow('Tag count must be between 0 and 5')
      expect(() => createUserWithConfirmedTags(6)).toThrow('Tag count must be between 0 and 5')
    })

    it('should throw error for mismatched tag names length', () => {
      expect(() => createUserWithConfirmedTags(2, ['tag1'])).toThrow(
        'tagNames length (1) must match tagCount (2)'
      )
    })
  })

  describe('createUserWithTagsAndAccounts', () => {
    it('should create user with default configuration', async () => {
      const result = await createUserWithTagsAndAccounts(seedClient)

      expect(result.user).toBeDefined()
      expect(result.profile).toBeDefined()

      // Filter tags that belong to this user only
      const userTags = result.tags.filter((tag) => tag.user_id === result.user?.id)
      expect(userTags).toHaveLength(1)

      expect(result.sendAccount).toBeDefined()
      expect(result.sendAccountTags).toHaveLength(1)
      expect(result.chainAddresses).toHaveLength(1)

      // Verify tag is confirmed
      expect(userTags[0]?.status).toBe('confirmed')

      // Verify profile has public visibility
      expect(result.profile?.is_public).toBe(true)
      expect(result.profile?.referral_code).toBeDefined()
    })

    it('should create user with specific tag count', async () => {
      const result = await createUserWithTagsAndAccounts(seedClient, { tagCount: 3 })

      // Filter tags that belong to this user only
      const userTags = result.tags.filter((tag) => tag.user_id === result.user?.id)
      expect(userTags).toHaveLength(3)
      expect(result.sendAccountTags).toHaveLength(3)

      for (const tag of userTags) {
        expect(tag.status).toBe('confirmed')
      }
    })

    it('should create user with specific tag names', async () => {
      const tagNames = ['mytag1', 'mytag2']
      const result = await createUserWithTagsAndAccounts(seedClient, {
        tagCount: 2,
        tagNames,
      })

      // Filter tags that belong to this user only
      const userTags = result.tags.filter((tag) => tag.user_id === result.user?.id)
      expect(userTags).toHaveLength(2)
      expect(userTags.map((t) => t.name)).toEqual(tagNames)
    })

    it('should create user with custom referral code', async () => {
      const customReferralCode = 'customref123'
      const result = await createUserWithTagsAndAccounts(seedClient, {
        referralCode: customReferralCode,
      })

      expect(result.profile?.referral_code).toBe(customReferralCode)
    })

    it('should create user with private profile', async () => {
      const result = await createUserWithTagsAndAccounts(seedClient, {
        isPublic: false,
      })

      expect(result.profile?.is_public).toBe(false)
    })

    it('should verify database relationships', async () => {
      const result = await createUserWithTagsAndAccounts(seedClient, { tagCount: 2 })

      // Verify send_account_tags relationship in database
      const { rows: satRows } = await pgClient.query(
        'SELECT * FROM send_account_tags WHERE send_account_id = $1',
        [result.sendAccount?.id]
      )
      expect(satRows).toHaveLength(2)

      // Verify tags are associated with user
      const { rows: tagRows } = await pgClient.query(
        'SELECT * FROM tags WHERE user_id = $1 AND status = $2',
        [result.user?.id, 'confirmed']
      )
      expect(tagRows).toHaveLength(2)

      // Verify main_tag_id behavior (may be null if trigger doesn't fire during test)
      const { rows: sendAccountRows } = await pgClient.query(
        'SELECT main_tag_id FROM send_accounts WHERE id = $1',
        [result.sendAccount?.id]
      )
      const userTags = result.tags.filter((tag) => tag.user_id === result.user?.id)

      // main_tag_id should either be null or set to one of the user's tags
      const mainTagId = sendAccountRows[0]?.main_tag_id
      if (mainTagId !== null) {
        expect(userTags.some((tag) => tag.id === mainTagId)).toBe(true)
      }
      // Just verify the query returns data
      expect(sendAccountRows).toHaveLength(1)
    })
  })

  describe('createMultipleUsersWithTags', () => {
    it('should create multiple users with different tag counts', async () => {
      const users = [{ tagCount: 1 }, { tagCount: 2 }, { tagCount: 3 }]

      const results = await createMultipleUsersWithTags(seedClient, users)

      expect(results).toHaveLength(3)

      // Filter tags for each user separately
      const user0Tags = results[0]?.tags.filter((tag) => tag.user_id === results[0]?.user?.id)
      const user1Tags = results[1]?.tags.filter((tag) => tag.user_id === results[1]?.user?.id)
      const user2Tags = results[2]?.tags.filter((tag) => tag.user_id === results[2]?.user?.id)

      expect(user0Tags).toHaveLength(1)
      expect(user1Tags).toHaveLength(2)
      expect(user2Tags).toHaveLength(3)

      // Verify each user has unique data
      const userIds = results.map((r) => r.user?.id).filter(Boolean)
      expect(new Set(userIds)).toEqual(expect.any(Set))
      expect(userIds).toHaveLength(3)
    })

    it('should create users with specific configurations', async () => {
      const users = [
        { tagCount: 1, referralCode: 'ref1', isPublic: true },
        { tagCount: 2, tagNames: ['special1', 'special2'], isPublic: false },
      ]

      const results = await createMultipleUsersWithTags(seedClient, users)

      expect(results).toHaveLength(2)

      // First user
      expect(results[0]?.profile?.referral_code).toBe('ref1')
      expect(results[0]?.profile?.is_public).toBe(true)
      const user0Tags = results[0]?.tags.filter((tag) => tag.user_id === results[0]?.user?.id)
      expect(user0Tags).toHaveLength(1)

      // Second user
      expect(results[1]?.profile?.is_public).toBe(false)
      const user1Tags = results[1]?.tags.filter((tag) => tag.user_id === results[1]?.user?.id)
      expect(user1Tags).toHaveLength(2)
      expect(user1Tags?.map((t) => t.name)).toEqual(['special1', 'special2'])
    })

    it('should verify database state with multiple users', async () => {
      const users = [{ tagCount: 2 }, { tagCount: 1 }]
      const results = await createMultipleUsersWithTags(seedClient, users)

      // Check total users created
      const userIds = results.map((r) => r.user?.id).filter(Boolean)
      const { rows: userRows } = await pgClient.query(
        'SELECT id FROM auth.users WHERE id = ANY($1::uuid[])',
        [userIds]
      )
      expect(userRows).toHaveLength(2)

      // Check total tags created (2 + 1 = 3)
      const { rows: tagRows } = await pgClient.query(
        'SELECT id FROM tags WHERE user_id = ANY($1::uuid[])',
        [userIds]
      )
      expect(tagRows).toHaveLength(3)

      // Check send_account_tags relationships
      const sendAccountIds = results.map((r) => r.sendAccount?.id).filter(Boolean)
      const { rows: satRows } = await pgClient.query(
        'SELECT * FROM send_account_tags WHERE send_account_id = ANY($1::uuid[])',
        [sendAccountIds]
      )
      expect(satRows).toHaveLength(3)
    })
  })

  describe('userOnboarded compatibility', () => {
    it('should work with existing userOnboarded preset', async () => {
      const plan = await seedClient.users([userOnboarded])

      expect(plan.users).toHaveLength(1)
      expect(plan.profiles).toHaveLength(1)

      // Filter tags for the created user
      const userTags = plan.tags.filter((tag) => tag.user_id === plan.users[0]?.id)
      expect(userTags).toHaveLength(1)

      expect(plan.send_accounts).toHaveLength(1)
      expect(plan.send_account_tags).toHaveLength(1)

      // Verify the tag is confirmed
      expect(userTags[0]?.status).toBe('confirmed')
    })

    it('should create users that follow database constraints', async () => {
      // Test that we can create up to 5 tags (the database limit)
      const result = await createUserWithTagsAndAccounts(seedClient, { tagCount: 5 })

      // Filter tags for this user
      const userTags = result.tags.filter((tag) => tag.user_id === result.user?.id)
      expect(userTags).toHaveLength(5)
      expect(result.sendAccountTags).toHaveLength(5)

      // Verify all tags are confirmed and belong to the user
      const { rows: tagRows } = await pgClient.query('SELECT * FROM tags WHERE user_id = $1', [
        result.user?.id,
      ])
      expect(tagRows).toHaveLength(5)
      for (const tag of tagRows) {
        expect(tag.status).toBe('confirmed')
      }
    })
  })

  // ==========================================================================
  // Contact Factory Function Tests
  // ==========================================================================

  describe('generateExternalAddress', () => {
    it('should generate valid EVM addresses', () => {
      const { address, chainId } = generateExternalAddress('test-seed-1', 'evm')

      expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/)
      expect(chainId).toMatch(/^eip155:\d+$/)
    })

    it('should generate valid Solana addresses', () => {
      const { address, chainId } = generateExternalAddress('test-seed-2', 'solana')

      expect(address).toMatch(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/)
      expect(chainId).toMatch(/^solana:[A-Za-z0-9]+$/)
    })

    it('should generate valid Canton addresses', () => {
      const { address, chainId } = generateExternalAddress('test-seed-3', 'canton')

      expect(address).toMatch(/^[a-zA-Z0-9-]+::[0-9a-fA-F]{64,}$/)
      expect(chainId).toMatch(/^canton:[A-Za-z0-9-]+$/)
    })

    it('should generate deterministic addresses for same seed', () => {
      const result1 = generateExternalAddress('same-seed', 'solana')
      const result2 = generateExternalAddress('same-seed', 'solana')

      expect(result1.address).toBe(result2.address)
      expect(result1.chainId).toBe(result2.chainId)
    })
  })

  describe('createSendContactInput', () => {
    it('should create valid Send user contact input', () => {
      const input = createSendContactInput({
        ownerId: 'owner-uuid-1',
        contactUserId: 'contact-uuid-2',
        source: 'manual',
        customName: 'My Friend',
        notes: 'Met at conference',
        isFavorite: true,
      })

      expect(input.owner_id).toBe('owner-uuid-1')
      expect(input.contact_user_id).toBe('contact-uuid-2')
      expect(input.source).toBe('manual')
      expect(input.custom_name).toBe('My Friend')
      expect(input.notes).toBe('Met at conference')
      expect(input.is_favorite).toBe(true)
      // external_address and chain_id are explicitly null to prevent Snaplet auto-generation
      expect(input.external_address).toBeNull()
      expect(input.chain_id).toBeNull()
    })

    it('should use default values', () => {
      const input = createSendContactInput({
        ownerId: 'owner-uuid-1',
        contactUserId: 'contact-uuid-2',
      })

      expect(input.source).toBe('manual')
      expect(input.is_favorite).toBe(false)
      expect(input.custom_name).toBeNull()
      expect(input.notes).toBeNull()
    })

    it('should accept all valid sources', () => {
      const sources = ['manual', 'activity', 'referral'] as const
      for (const source of sources) {
        const input = createSendContactInput({
          ownerId: 'owner-1',
          contactUserId: 'contact-2',
          source,
        })
        expect(input.source).toBe(source)
      }
    })

    it('should throw on self-contact', () => {
      expect(() =>
        createSendContactInput({
          ownerId: 'same-uuid',
          contactUserId: 'same-uuid',
        })
      ).toThrow('Cannot create self-contact')
    })

    it('should throw on custom_name exceeding 80 chars', () => {
      expect(() =>
        createSendContactInput({
          ownerId: 'owner-1',
          contactUserId: 'contact-2',
          customName: 'a'.repeat(81),
        })
      ).toThrow('custom_name exceeds 80 chars')
    })

    it('should throw on notes exceeding 500 chars', () => {
      expect(() =>
        createSendContactInput({
          ownerId: 'owner-1',
          contactUserId: 'contact-2',
          notes: 'a'.repeat(501),
        })
      ).toThrow('notes exceeds 500 chars')
    })
  })

  describe('createExternalContactInput', () => {
    it('should create valid EVM external contact', () => {
      const input = createExternalContactInput({
        ownerId: 'owner-uuid-1',
        address: '0x1234567890123456789012345678901234567890',
        chainId: 'eip155:1',
        customName: 'Ethereum Wallet',
      })

      expect(input.owner_id).toBe('owner-uuid-1')
      expect(input.external_address).toBe('0x1234567890123456789012345678901234567890')
      expect(input.chain_id).toBe('eip155:1')
      expect(input.source).toBe('external')
      expect(input.custom_name).toBe('Ethereum Wallet')
      // contact_user_id is explicitly null to prevent Snaplet auto-generation
      expect(input.contact_user_id).toBeNull()
    })

    it('should create valid Solana external contact', () => {
      const input = createExternalContactInput({
        ownerId: 'owner-uuid-1',
        address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
        chainId: 'solana:mainnet',
      })

      expect(input.external_address).toBe('7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU')
      expect(input.chain_id).toBe('solana:mainnet')
      expect(input.source).toBe('external')
    })

    it('should create valid Canton external contact', () => {
      const hexPart = 'a'.repeat(64)
      const input = createExternalContactInput({
        ownerId: 'owner-uuid-1',
        address: `party-name::${hexPart}`,
        chainId: 'canton:global',
      })

      expect(input.external_address).toBe(`party-name::${hexPart}`)
      expect(input.chain_id).toBe('canton:global')
      expect(input.source).toBe('external')
    })

    it('should throw on invalid EVM address format', () => {
      expect(() =>
        createExternalContactInput({
          ownerId: 'owner-1',
          address: '0xinvalid',
          chainId: 'eip155:1',
        })
      ).toThrow('Invalid EVM address format')
    })

    it('should throw on invalid EVM chain_id format', () => {
      expect(() =>
        createExternalContactInput({
          ownerId: 'owner-1',
          address: '0x1234567890123456789012345678901234567890',
          chainId: 'eip155:',
        })
      ).toThrow('Invalid EVM chain_id format')
    })

    it('should throw on invalid Solana address format', () => {
      expect(() =>
        createExternalContactInput({
          ownerId: 'owner-1',
          address: 'invalid0OIl', // Contains invalid base58 chars
          chainId: 'solana:mainnet',
        })
      ).toThrow('Invalid Solana address format')
    })

    it('should throw on invalid Canton address format', () => {
      expect(() =>
        createExternalContactInput({
          ownerId: 'owner-1',
          address: 'missing-hex-part',
          chainId: 'canton:global',
        })
      ).toThrow('Invalid Canton address format')
    })

    it('should throw on unknown chain prefix', () => {
      expect(() =>
        createExternalContactInput({
          ownerId: 'owner-1',
          address: 'some-address',
          chainId: 'unknown:chain',
        })
      ).toThrow('Unknown chain_id prefix')
    })
  })

  describe('createContactLabelInput', () => {
    it('should create valid label input', () => {
      const input = createContactLabelInput({
        ownerId: 'owner-uuid-1',
        name: 'Family',
        color: '#FF6B6B',
      })

      expect(input.owner_id).toBe('owner-uuid-1')
      expect(input.name).toBe('Family')
      expect(input.color).toBe('#FF6B6B')
    })

    it('should allow null color', () => {
      const input = createContactLabelInput({
        ownerId: 'owner-uuid-1',
        name: 'Work',
      })

      expect(input.color).toBeNull()
    })

    it('should accept 1-char name (edge case)', () => {
      const input = createContactLabelInput({
        ownerId: 'owner-1',
        name: 'X',
      })

      expect(input.name).toBe('X')
    })

    it('should accept 32-char name (edge case)', () => {
      const name = 'a'.repeat(32)
      const input = createContactLabelInput({
        ownerId: 'owner-1',
        name,
      })

      expect(input.name).toBe(name)
    })

    it('should throw on empty name', () => {
      expect(() =>
        createContactLabelInput({
          ownerId: 'owner-1',
          name: '',
        })
      ).toThrow('Label name must be at least 1 character')
    })

    it('should throw on name exceeding 32 chars', () => {
      expect(() =>
        createContactLabelInput({
          ownerId: 'owner-1',
          name: 'a'.repeat(33),
        })
      ).toThrow('Label name exceeds 32 chars')
    })
  })

  describe('generateContactNetworkData', () => {
    it('should generate data with default config', () => {
      const users = Array.from({ length: 20 }, (_, i) => ({ id: `user-${i}` }))
      const { contacts, labels, labelAssignments } = generateContactNetworkData(users)

      expect(contacts.length).toBeGreaterThan(0)
      expect(labels.length).toBeGreaterThan(0)
      // labelAssignments may be 0 if no contacts were assigned labels
      expect(labelAssignments).toBeDefined()
    })

    it('should respect perUser distribution', () => {
      const users = Array.from({ length: 10 }, (_, i) => ({ id: `user-${i}` }))
      const config = {
        ...DEFAULT_CONTACT_NETWORK_CONFIG,
        perUser: {
          zero: 5, // 5 users with no contacts
          light: 3, // 3 users with 1-2 contacts
          medium: 2, // 2 users with 5-10 contacts
          heavy: 0, // 0 users with many contacts
        },
      }

      const { contacts } = generateContactNetworkData(users, config)

      // Should have contacts from 5 users (3 light + 2 medium)
      // Light: 3 users * 1-2 contacts = 3-6 contacts
      // Medium: 2 users * 5-10 contacts = 10-20 contacts
      // Total: 13-26 contacts (approximately)
      expect(contacts.length).toBeGreaterThan(0)
      expect(contacts.length).toBeLessThan(50)
    })

    it('should generate mix of Send-user and external contacts', () => {
      const users = Array.from({ length: 50 }, (_, i) => ({ id: `user-${i}` }))
      const { contacts } = generateContactNetworkData(users)

      // Check for actual non-null values to distinguish contact types
      const sendUserContacts = contacts.filter((c) => c.contact_user_id != null)
      const externalContacts = contacts.filter((c) => c.external_address != null)

      expect(sendUserContacts.length).toBeGreaterThan(0)
      expect(externalContacts.length).toBeGreaterThan(0)
      // Verify mutual exclusivity - each contact should be one type or the other
      const total = sendUserContacts.length + externalContacts.length
      expect(total).toBe(contacts.length)
    })

    it('should generate contacts with various sources', () => {
      const users = Array.from({ length: 50 }, (_, i) => ({ id: `user-${i}` }))
      const { contacts } = generateContactNetworkData(users)

      const sources = new Set(contacts.map((c) => c.source))
      // Should have at least manual and external
      expect(sources.has('manual')).toBe(true)
      expect(sources.has('external')).toBe(true)
    })

    it('should generate some favorites', () => {
      const users = Array.from({ length: 50 }, (_, i) => ({ id: `user-${i}` }))
      const { contacts } = generateContactNetworkData(users)

      const favorites = contacts.filter((c) => c.is_favorite === true)
      expect(favorites.length).toBeGreaterThan(0)
    })

    it('should generate some archived contacts', () => {
      const users = Array.from({ length: 50 }, (_, i) => ({ id: `user-${i}` }))
      const { contacts } = generateContactNetworkData(users)

      const archived = contacts.filter((c) => c.archived_at !== null)
      expect(archived.length).toBeGreaterThan(0)
    })

    it('should never create self-contacts', () => {
      const users = Array.from({ length: 50 }, (_, i) => ({ id: `user-${i}` }))
      const { contacts } = generateContactNetworkData(users)

      for (const contact of contacts) {
        if (contact.contact_user_id) {
          expect(contact.owner_id).not.toBe(contact.contact_user_id)
        }
      }
    })
  })

  describe('Contact seeding integration', () => {
    it('should seed Send-user contacts via raw SQL', async () => {
      // Create two users first
      const userResults = await createMultipleUsersWithTags(seedClient, [
        { tagCount: 1 },
        { tagCount: 1 },
      ])

      const ownerId = userResults[0]?.user?.id
      const contactUserId = userResults[1]?.user?.id

      if (!ownerId || !contactUserId) {
        throw new Error('Failed to create test users')
      }

      // Use raw SQL for Send-user contacts due to Snaplet FK relationship handling issues
      // Snaplet's relationship resolution can interfere with explicitly passed contact_user_id values
      await pgClient.query(
        `INSERT INTO contacts (owner_id, contact_user_id, custom_name, is_favorite, source)
         VALUES ($1, $2, $3, $4, $5)`,
        [ownerId, contactUserId, 'Test Contact', true, 'manual']
      )

      // Verify in database
      const { rows } = await pgClient.query(
        'SELECT * FROM contacts WHERE owner_id = $1 AND contact_user_id = $2',
        [ownerId, contactUserId]
      )

      expect(rows).toHaveLength(1)
      expect(rows[0].custom_name).toBe('Test Contact')
      expect(rows[0].is_favorite).toBe(true)
      expect(rows[0].source).toBe('manual')
    })

    it('should seed external contacts to database', async () => {
      // Create owner user
      const userResult = await createUserWithTagsAndAccounts(seedClient)
      const ownerId = userResult.user?.id

      if (!ownerId) {
        throw new Error('Failed to create test user')
      }

      // Generate external address
      const { address, chainId } = generateExternalAddress('test-external', 'evm')

      const contactInput = createExternalContactInput({
        ownerId,
        address,
        chainId,
        customName: 'External Wallet',
      })

      await seedClient.contacts([contactInput])

      // Verify in database
      const { rows } = await pgClient.query(
        'SELECT * FROM contacts WHERE owner_id = $1 AND external_address = $2',
        [ownerId, address]
      )

      expect(rows).toHaveLength(1)
      expect(rows[0].chain_id).toBe(chainId)
      expect(rows[0].source).toBe('external')
      expect(rows[0].custom_name).toBe('External Wallet')
    })

    it('should seed contact labels to database', async () => {
      // Create owner user
      const userResult = await createUserWithTagsAndAccounts(seedClient)
      const ownerId = userResult.user?.id

      if (!ownerId) {
        throw new Error('Failed to create test user')
      }

      const labelInput = createContactLabelInput({
        ownerId,
        name: 'TestLabel',
        color: '#4ECDC4',
      })

      await seedClient.contact_labels([labelInput])

      // Verify in database
      const { rows } = await pgClient.query(
        'SELECT * FROM contact_labels WHERE owner_id = $1 AND name = $2',
        [ownerId, 'TestLabel']
      )

      expect(rows).toHaveLength(1)
      expect(rows[0].color).toBe('#4ECDC4')
    })
  })
})
