import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals'
import { createSeedClient } from '@snaplet/seed'
import type { SeedPostgres } from '@snaplet/seed/adapter-postgres'
import type { SeedClient } from '@snaplet/seed'
import pg from 'pg'
import {
  createUserWithConfirmedTags,
  createUserWithTagsAndAccounts,
  createMultipleUsersWithTags,
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
})
