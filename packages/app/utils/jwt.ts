import jwt from 'jsonwebtoken'
import type { SignOptions, Secret } from 'jsonwebtoken'

const jwtSecret = process.env.SUPABASE_JWT_SECRET as Secret

/**
 * @todo Audit capabilities for JWTs created via this method, see https://github.com/0xsend/sendapp/pull/437#discussion_r1624477143
 * @param {string} sub - subject (userId of user in the public.auth table)
 * @returns JWT token representing an authenticated user
 */
export const mintAuthenticatedJWTToken = (sub: string): string => {
  const options = {
    expiresIn: '7d',
  }

  return mintJWTToken('authenticated', 'authenticated', sub, options)
}

export const mintJWTToken = (
  aud: string,
  role: string,
  sub: string,
  options?: SignOptions
): string => {
  const payload = {
    aud,
    role,
    sub,
    is_anonymous: !sub,
  }

  const token = jwt.sign(payload, jwtSecret, options)
  return token
}
