// @ts-expect-error set __DEV__ for code shared between server and client
globalThis.__DEV__ = true

import { describe, expect, it, mock } from 'bun:test'
import request from 'supertest'
import app from './app'
import { supabaseAdmin } from './supabase'
import pino from 'pino'
import { DistributorWorker } from './distributor'
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
    const res = await request(app).post('/distributor')

    expect(res.statusCode).toBe(401)
    expect(res.body).toEqual('Unauthorized')
  })

  it('should handle authorization correctly', async () => {
    const res = await request(app).get('/distributor')

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
      .post('/distributor')
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

describe('Distributor Worker', () => {
  it('should calculate distribution shares', async () => {
    const distribution = {
      id: 4,
      number: 4,
      amount: 10000,
      hodler_pool_bips: 6500,
      bonus_pool_bips: 3500,
      fixed_pool_bips: 1000,
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
          fixed_value: 0,
          bips_value: 500,
          distribution_id: 4,
          created_at: '2024-04-06T16:49:02.569245+00:00',
          updated_at: '2024-04-06T16:49:02.569245+00:00',
        },
        {
          type: 'tag_registration',
          fixed_value: 100,
          bips_value: 0,
          distribution_id: 4,
          created_at: '2024-04-06T16:49:02.569245+00:00',
          updated_at: '2024-04-06T16:49:02.569245+00:00',
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
      fetchAllVerifications: mock((distributionId: number) => {
        return Promise.resolve({
          data: [
            {
              user_id,
              type: 'tag_referral',
            },
            {
              user_id,
              type: 'tag_registration',
            },
            // alice only has tag_registration
            {
              user_id: user_id2,
              type: 'tag_registration',
            },
          ],
          count: 3,
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
    const distributor = new DistributorWorker(logger, false)
    await distributor.calculateDistribution('4')

    const expectedShares = [
      {
        address: bobAddr,
        distribution_id: 4,
        user_id,
        amount: '4649',
        bonus_pool_amount: '216',
        fixed_pool_amount: '100',
        hodler_pool_amount: '4333',
      },
      {
        address: aliceAddr,
        distribution_id: 4,
        user_id: user_id2,
        amount: '2266',
        bonus_pool_amount: '0',
        fixed_pool_amount: '100',
        hodler_pool_amount: '2166',
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
