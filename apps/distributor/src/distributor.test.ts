// @ts-expect-error set __DEV__ for code shared between server and client
globalThis.__DEV__ = true

import request from 'supertest'
import { describe, expect, it } from 'bun:test'
import app from './app'

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
    // get latest distribution id from API
    let lastDistributionId: number
    while (true) {
      const res = await request(app).get('/distributor')
      expect(res.statusCode).toBe(200)
      if (res.body.lastDistributionId) {
        lastDistributionId = res.body.lastDistributionId
        break
      }
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }

    expect(lastDistributionId).toBeDefined()
  }, 10_000)
})
