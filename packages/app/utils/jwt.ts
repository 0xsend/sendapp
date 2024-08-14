import jwt from 'jsonwebtoken'
import type { SignOptions, Secret } from 'jsonwebtoken'

const jwtSecret = process.env.SUPABASE_JWT_SECRET as Secret

// 14 days
export const JWT_ACCESS_TOKEN_EXPIRY_SECS = 1209600

/**
 * @todo Audit capabilities for JWTs created via this method, see https://github.com/0xsend/sendapp/pull/437#discussion_r1624477143
 * @param {string} sub - subject (userId of user in the public.auth table)
 * @returns JWT token representing an authenticated user
 */
export const mintAuthenticatedJWTToken = (sub: string): string => {
  const options = {
    expiresIn: JWT_ACCESS_TOKEN_EXPIRY_SECS,
  }

  return mintJWTToken('authenticated', 'authenticated', sub, options)
}

const mintJWTToken = (aud: string, role: string, sub: string, options?: SignOptions): string => {
  const payload = {
    aud,
    role,
    sub,
    is_anonymous: !sub,
  }

  const token = jwt.sign(payload, jwtSecret, options)
  return token
}
