import { type SignOptions, sign } from 'jsonwebtoken'
import * as crypto from 'node:crypto'
import debug from 'debug'

const log = debug('api:helpers:coinbase')

if (!process.env.CDP_KEY_NAME || !process.env.CDP_PRIVATE_KEY) {
  throw new Error('CDP_KEY_NAME and CDP_PRIVATE_KEY environment variables are required')
}

const KEY_NAME = process.env.CDP_KEY_NAME
const PRIVATE_KEY = process.env.CDP_PRIVATE_KEY.replace(/\\n/g, '\n').trim()

export const CDP_API_DOMAIN = 'api.developer.coinbase.com'
export const CDP_API_URL = `https://${CDP_API_DOMAIN}`
export const CDP_PAY_URL = 'https://pay.coinbase.com/buy/select-asset'

export function generateCoinbaseJWT(method: string, path: string): string {
  try {
    const uri = `${method} ${CDP_API_DOMAIN}${path}`
    const now = Math.floor(Date.now() / 1000)

    const payload = {
      iss: 'coinbase-cloud',
      nbf: now,
      exp: now + 120,
      sub: KEY_NAME,
      uri,
    }

    const signOptions: SignOptions = {
      algorithm: 'ES256',
      header: {
        kid: KEY_NAME,
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        nonce: crypto.randomBytes(16).toString('hex'),
      },
    }

    return sign(payload, PRIVATE_KEY, signOptions)
  } catch (error) {
    log('Error generating JWT:', error)
    throw error
  }
}
