// @ts-expect-error set __DEV__ for code shared between server and client
globalThis.__DEV__ = true

import { describe, expect, it } from 'bun:test'
import request from 'supertest'
import app from './app'
import { supabaseAdmin } from './distributor'

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

  it('should perform distributor logic correctly', async () => {
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

  // it('should return a merkle root', async () => {
  //   const res = await request(app)
  //     .post('/distributor/merkle')
  //     .set('Authorization', `Bearer ${process.env.SUPABASE_SERVICE_ROLE}`)
  //     .send({ id: '4' })

  //   expect(res.statusCode).toBe(200)
  //   expect(res.body).toMatchObject({
  //     root: expect.stringMatching(/^0x[a-f0-9]{64}$/),
  //     total: expect.any(Number),
  //   })
  // })
})
