import jwt from 'jsonwebtoken'
import type { SignOptions, Secret } from 'jsonwebtoken'

const jwtSecret = process.env.SUPABASE_JWT_SECRET as Secret

export const mintAuthenticatedJWTToken = (sub: string): string => {
  const options = {
    expiresIn: '7d',
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
