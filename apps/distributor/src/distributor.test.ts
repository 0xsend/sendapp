import { describe, it, expect } from 'vitest'
import request from 'supertest'
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
    const res = await request(app)
      .post('/distributor')
      .send({ id: 1 })
      .set('Authorization', `Bearer ${process.env.SUPABASE_SERVICE_ROLE}`)

    expect(res.statusCode).toBe(200)
  }, 10_000)
})
