// @ts-expect-error set __DEV__ for code shared between server and client
globalThis.__DEV__ = true

import { describe, expect, it, mock } from 'bun:test'
import request from 'supertest'
import app from './app'
import { supabaseAdmin } from './supabase'
import pino from 'pino'
import { DistributorV2Worker } from './distributorv2'
import type { Tables } from '@my/supabase/database.types'

describe('Root Route', () => {
  it('should return correct response for the root route', async () => {
    const res = await request(app).get('/')

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ root: true })
  })
})

describe('Distributor Route', () => {
  it('should reject unauthorized requests', async () => {
    const res = await request(app).post('/distributor/v2')

    expect(res.statusCode).toBe(401)
    expect(res.body).toEqual('Unauthorized')
  })

  it('should handle authorization correctly', async () => {
    const res = await request(app).get('/distributor/v2')

    expect(res.statusCode).toBe(200)
    expect(res.body).toMatchObject({
      distributor: true,
      running: true,
    })
  })

  it.skip('should perform distributor logic correctly', async () => {
    const { data: distribution, error } = await supabaseAdmin
      .from('distributions')
      .select(
        `*,
        distribution_verification_values (*)`
      )
      .order('number', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      throw error
    }

    if (!distribution) {
      throw new Error('No distributions found')
    }

    expect(distribution).toBeDefined()

    const res = await request(app)
      .post('/distributor/v2')
      .set('Content-Type', 'application/json')
      .set('Authorization', `Bearer ${process.env.SUPABASE_SERVICE_ROLE}`)
      .send({ id: distribution.number })

    expect(res.statusCode).toBe(200)
    expect(res.body).toMatchObject({
      distributor: true,
      id: distribution.id,
    })
  })

  it.skip('should return a merkle root', async () => {
    const res = await request(app)
      .post('/distributor/merkle')
      .set('Authorization', `Bearer ${process.env.SUPABASE_SERVICE_ROLE}`)
      .send({ id: '4' })

    expect(res.statusCode).toBe(200)
    expect({
      root: res.body.root,
      total: res.body.total,
    }).toMatchSnapshot('distribution 4 merkle root')
  })
})

describe('Distributor V2 Worker', () => {
  it('should calculate distribution shares', async () => {
    const distribution = {
      id: 4,
      number: 4,
      amount: 10000,
      hodler_pool_bips: 10000,
      bonus_pool_bips: 0,
      fixed_pool_bips: 10000,
      name: 'Distribution #4',
      description: 'Fourth distributions of 900,000,000 SEND tokens to early hodlers',
      qualification_start: '2024-04-08T00:00:00+00:00',
      qualification_end: '2024-04-21T00:00:00+00:00',
      claim_end: '2024-05-31T23:59:59+00:00',
      hodler_min_balance: 100000,
      created_at: '2024-04-06T16:49:02.569245+00:00',
      updated_at: '2024-04-06T16:49:02.569245+00:00',
      snapshot_block_num: 13261327,
      chain_id: 845337,
      distribution_verification_values: [
        {
          type: 'tag_referral',
          fixed_value: 50,
          bips_value: 0,
          multiplier_min: 1.5,
          multiplier_max: 2.5,
          multiplier_step: 0.1,
          distribution_id: 4,
          mode: 'individual',
        },
        {
          type: 'total_tag_referrals',
          fixed_value: 0,
          bips_value: 0,
          multiplier_min: 1.0,
          multiplier_max: 2.0,
          multiplier_step: 0.01,
          mode: 'aggregate',
          created_at: '2024-04-06T16:49:02.569245+00:00',
          updated_at: '2024-04-06T16:49:02.569245+00:00',
          distribution_id: 4,
        },
        {
          type: 'create_passkey',
          fixed_value: 200,
          bips_value: 0,
          distribution_id: 4,
          mode: 'individual',
        },
        {
          type: 'tag_registration',
          fixed_value: 100,
          bips_value: 0,
          distribution_id: 4,
          created_at: '2024-04-06T16:49:02.569245+00:00',
          updated_at: '2024-04-06T16:49:02.569245+00:00',
          mode: 'individual',
        },
        {
          type: 'send_ten',
          fixed_value: 100,
          bips_value: 0,
          distribution_id: 4,
          created_at: '2024-04-06T16:49:02.569245+00:00',
          updated_at: '2024-04-06T16:49:02.569245+00:00',
          mode: 'individual',
        },
        {
          type: 'send_one_hundred',
          fixed_value: 200,
          bips_value: 0,
          distribution_id: 4,
          created_at: '2024-04-06T16:49:02.569245+00:00',
          updated_at: '2024-04-06T16:49:02.569245+00:00',
          mode: 'individual',
        },
        {
          type: 'send_streak',
          fixed_value: 10,
          bips_value: 0,
          distribution_id: 4,
          multiplier_min: 1.0,
          multiplier_max: 5.0,
          multiplier_step: 0.2,
          created_at: '2024-04-06T16:49:02.569245+00:00',
          updated_at: '2024-04-06T16:49:02.569245+00:00',
          mode: 'aggregate',
        },
      ],
    } as Tables<'distributions'> & {
      distribution_verification_values: Tables<'distribution_verification_values'>[]
    }
    const user_id = crypto.randomUUID()
    const user_id2 = crypto.randomUUID()
    const bobAddr = '0xb0b0000000000000000000000000000000000000'
    const aliceAddr = '0xalice000000000000000000000000000000000000'

    const createDistributionShares = mock(
      (distributionId: number, shares: Tables<'distribution_shares'>[]) => {
        return Promise.resolve({
          data: null,
          error: null,
        })
      }
    )

    mock.module('./supabase', () => ({
      fetchDistribution: mock((id: string) => {
        return Promise.resolve({
          data: distribution,
          error: null,
        })
      }),
      /*
      Back of the napkin
      Pool = 10,000
      Fixed
        Bobs = 200 + 200 + 100 + 100 + 50 + 50 = 700 * 1.5 * 1.01 * 2 = 2121
        Alices = 100 + 100 * 1.05 = 205
      Hodlers = 10,000 - 2121 - 205 = 7674
        Bobs = 7674 * 1,000,000 /1,500,000 = 5116
        Alices = 7674 * 500,000 /1,500,000 = 2558
      */
      fetchAllVerifications: mock((distributionId: number) => {
        return Promise.resolve({
          data: [
            { user_id, type: 'create_passkey' },
            {
              user_id,
              type: 'tag_referral',
              weight: 1,
            },

            {
              user_id,
              type: 'tag_registration',
              weight: 1,
            },
            {
              user_id,
              type: 'send_ten',
              weight: 1,
            },
            {
              user_id,
              type: 'send_one_hundred',
              weight: 1,
            },
            {
              user_id,
              type: 'total_tag_referrals',
              metadata: {
                value: 2,
              },
              weight: 2,
            },
            {
              user_id: user_id,
              type: 'send_streak',
              metadata: {
                value: 5,
              },
              weight: 5,
            },
            // alice only has tag_registration
            {
              user_id: user_id2,
              type: 'tag_registration',
              weight: 1,
            },
            {
              user_id: user_id2,
              type: 'send_ten',
              weight: 1,
            },
            {
              user_id: user_id2,
              type: 'total_tag_referrals',
              metadata: {
                value: 5,
              },
              weight: 5,
            },
          ],
          count: 10,
          error: null,
        })
      }),
      fetchAllHodlers: mock((distributionId: number) => {
        return Promise.resolve({
          data: [
            {
              address: bobAddr,
              created_at: '2024-04-06T16:49:02.569245+00:00',
              user_id,
            },
            {
              address: aliceAddr,
              created_at: '2024-04-06T16:49:02.569245+00:00',
              user_id: user_id2,
            },
          ],
          error: null,
        })
      }),
      createDistributionShares,
    }))

    mock.module('./wagmi', () => ({
      fetchAllBalances: mock(({ addresses, distribution }) => {
        return [
          Promise.resolve({
            user_id,
            address: bobAddr,
            balance: '1000000',
          }),
          // alice has half of the balance of bob
          Promise.resolve({
            user_id: user_id2,
            address: aliceAddr,
            balance: '500000',
          }),
        ]
      }),
      isMerkleDropActive: mock((distribution) => {
        return Promise.resolve(false)
      }),
    }))

    const logger = pino({
      level: 'silent',
    })
    const distributor = new DistributorV2Worker(logger, false)
    await distributor.calculateDistribution('4')

    //Expected values are a little different than back of the napkin because of rounding
    //Keep an eye on this, may need to investigate if we see distro problems
    const expectedShares = [
      {
        address: bobAddr,
        distribution_id: 4,
        user_id,
        amount: '6856',
        bonus_pool_amount: '0', // Always 0 in V2
        fixed_pool_amount: '984',
        hodler_pool_amount: '5872',
      },
      {
        address: aliceAddr,
        distribution_id: 4,
        user_id: user_id2,
        amount: '3144',
        bonus_pool_amount: '0', // Always 0 in V2
        fixed_pool_amount: '208',
        hodler_pool_amount: '2936',
      },
    ]
    expect(createDistributionShares).toHaveBeenCalled()

    // @ts-expect-error supabase-js does not support bigint
    expect(createDistributionShares.mock.calls[0]).toEqual([distribution.id, expectedShares])

    // expected share amounts cannot exceed the total distribution amount
    const totalDistributionAmount = BigInt(distribution.amount)
    const totalShareAmounts = expectedShares.reduce((acc, share) => acc + BigInt(share.amount), 0n)
    expect(totalShareAmounts).toBeLessThanOrEqual(totalDistributionAmount)
  })
})
