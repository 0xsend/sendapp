import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'
import type { NextApiRequest, NextApiResponse } from 'next'
import type { Database } from '@my/supabase/database.types'

// ============================================================================
// Constants for validation
// ============================================================================

/** Maximum endpoint URL length (2KB - typical push endpoints are ~500-800 chars) */
const MAX_ENDPOINT_LENGTH = 2048

/** Maximum p256dh key length (base64 encoded, typically 87 chars) */
const MAX_P256DH_LENGTH = 200

/** Maximum auth key length (base64 encoded, typically 22 chars) */
const MAX_AUTH_LENGTH = 100

/** Maximum request body size (10KB should be plenty) */
const MAX_BODY_SIZE = 10 * 1024

/** Allowed endpoint URL protocols */
const ALLOWED_ENDPOINT_PROTOCOLS = ['https:']

/** Known push service domains (for validation) */
const KNOWN_PUSH_DOMAINS = [
  'fcm.googleapis.com',
  'updates.push.services.mozilla.com',
  'web.push.apple.com',
  'wns.windows.com',
  'push.services.mozilla.com',
]

// ============================================================================
// Rate limiting (best-effort; in-memory)
// ============================================================================

/** Rate limit window (per user+IP) */
const RATE_LIMIT_WINDOW_MS = 60 * 1000

/** Max subscription mutations per window */
const RATE_LIMIT_MAX = 20

type RateLimitEntry = { count: number; resetAt: number }

type GlobalRateLimitStore = {
  __webPushSubscribeRateLimitStore?: Map<string, RateLimitEntry>
}

function getRateLimitStore(): Map<string, RateLimitEntry> {
  const g = globalThis as unknown as GlobalRateLimitStore
  if (!g.__webPushSubscribeRateLimitStore) {
    g.__webPushSubscribeRateLimitStore = new Map()
  }
  return g.__webPushSubscribeRateLimitStore
}

function getClientIp(req: NextApiRequest): string {
  const xff = req.headers['x-forwarded-for']
  if (typeof xff === 'string' && xff.trim()) {
    return xff.split(',')[0].trim()
  }
  const xri = req.headers['x-real-ip']
  if (typeof xri === 'string' && xri.trim()) {
    return xri.trim()
  }
  return req.socket.remoteAddress || 'unknown'
}

function checkRateLimit(key: string): { allowed: boolean; retryAfterSeconds?: number } {
  const store = getRateLimitStore()
  const now = Date.now()

  const existing = store.get(key)
  if (!existing || existing.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return { allowed: true }
  }

  if (existing.count >= RATE_LIMIT_MAX) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    }
  }

  existing.count += 1
  store.set(key, existing)
  return { allowed: true }
}

// ============================================================================
// Types
// ============================================================================

type ApiResponse = {
  success: boolean
  message?: string
  error?: string
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Check if value is a plain object (not null, not array)
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Validate push subscription endpoint URL
 * - Must be HTTPS
 * - Must be from a known push service domain
 * - Must not exceed max length
 */
function validateEndpoint(endpoint: unknown): {
  valid: boolean
  sanitized?: string
  error?: string
} {
  if (typeof endpoint !== 'string') {
    return { valid: false, error: 'Endpoint must be a string' }
  }

  if (endpoint.length > MAX_ENDPOINT_LENGTH) {
    return { valid: false, error: 'Endpoint too long' }
  }

  let url: URL
  try {
    url = new URL(endpoint)
  } catch {
    return { valid: false, error: 'Invalid endpoint URL' }
  }

  // Must be HTTPS
  if (!ALLOWED_ENDPOINT_PROTOCOLS.includes(url.protocol)) {
    return { valid: false, error: 'Endpoint must use HTTPS' }
  }

  // Validate against known push service domains
  const hostname = url.hostname.toLowerCase()
  const isKnownDomain = KNOWN_PUSH_DOMAINS.some(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
  )
  if (!isKnownDomain) {
    return { valid: false, error: 'Unknown push service domain' }
  }

  return { valid: true, sanitized: endpoint }
}

/**
 * Validate base64-encoded key (p256dh or auth)
 * - Must be valid base64url
 * - Must not exceed max length
 */
function validateKey(
  key: unknown,
  maxLength: number,
  keyName: string
): { valid: boolean; sanitized?: string; error?: string } {
  if (typeof key !== 'string') {
    return { valid: false, error: `${keyName} must be a string` }
  }

  if (key.length > maxLength) {
    return { valid: false, error: `${keyName} too long` }
  }

  // Base64url validation (allowing standard base64 too)
  const base64Regex = /^[A-Za-z0-9+/_-]+=*$/
  if (!base64Regex.test(key)) {
    return { valid: false, error: `${keyName} contains invalid characters` }
  }

  return { valid: true, sanitized: key }
}

/**
 * Validate same-origin request using Origin or Referer headers
 * Returns true if the request appears to be from the same origin
 */
function validateSameOrigin(req: NextApiRequest): boolean {
  // Get the expected host from the Host header
  const host = req.headers.host
  if (!host) return false

  // Check Origin header first (more reliable)
  const origin = req.headers.origin
  if (origin) {
    try {
      const originUrl = new URL(origin)
      // Compare hostname (ignore port differences for development)
      return originUrl.hostname === host.split(':')[0]
    } catch {
      return false
    }
  }

  // Fall back to Referer header
  const referer = req.headers.referer
  if (referer) {
    try {
      const refererUrl = new URL(referer)
      return refererUrl.hostname === host.split(':')[0]
    } catch {
      return false
    }
  }

  // No Origin or Referer - reject for POST/DELETE
  return false
}

/**
 * Validate request body structure and size
 */
function validateRequestBody(body: unknown): { valid: boolean; error?: string } {
  // Check if body exists
  if (body === null || body === undefined) {
    return { valid: false, error: 'Request body is required' }
  }

  // Must be an object
  if (!isPlainObject(body)) {
    return { valid: false, error: 'Request body must be an object' }
  }

  // Check approximate size (serialize and check length)
  try {
    const serialized = JSON.stringify(body)
    if (serialized.length > MAX_BODY_SIZE) {
      return { valid: false, error: 'Request body too large' }
    }
  } catch {
    return { valid: false, error: 'Invalid request body' }
  }

  return { valid: true }
}

// ============================================================================
// API Handler
// ============================================================================

/**
 * API route for managing web push subscriptions
 *
 * POST: Subscribe to web push notifications
 * DELETE: Unsubscribe from web push notifications
 *
 * Security measures:
 * - Method validation
 * - Same-origin validation (Origin/Referer)
 * - Request body size limits
 * - Input validation and sanitization
 * - No sensitive data logging
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
): Promise<void> {
  // Method check first (fail fast)
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    res.setHeader('Allow', ['POST', 'DELETE'])
    res.status(405).json({ success: false, error: 'Method not allowed' })
    return
  }

  // Same-origin validation for CSRF protection
  if (!validateSameOrigin(req)) {
    res.status(403).json({ success: false, error: 'Forbidden' })
    return
  }

  // Require JSON content type to avoid surprising body parsing behaviors
  const contentType = req.headers['content-type']
  if (typeof contentType !== 'string' || !contentType.toLowerCase().includes('application/json')) {
    res.status(415).json({ success: false, error: 'Content-Type must be application/json' })
    return
  }

  // Validate request body structure and size
  const bodyValidation = validateRequestBody(req.body)
  if (!bodyValidation.valid) {
    res.status(400).json({ success: false, error: bodyValidation.error })
    return
  }

  // Create authenticated Supabase client
  const supabase = createPagesServerClient<Database>({ req, res })

  // Get current user session
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError || !session?.user) {
    res.status(401).json({ success: false, error: 'Unauthorized' })
    return
  }

  const userId = session.user.id

  // Best-effort rate limiting (per user + IP) to reduce abuse potential
  const ip = getClientIp(req)
  const rateLimitKey = `webpush:${req.method}:${userId}:${ip}`
  const rateLimit = checkRateLimit(rateLimitKey)
  if (!rateLimit.allowed) {
    if (rateLimit.retryAfterSeconds) {
      res.setHeader('Retry-After', String(rateLimit.retryAfterSeconds))
    }
    res.status(429).json({ success: false, error: 'Too many requests' })
    return
  }

  if (req.method === 'POST') {
    await handleSubscribe(req, res, supabase, userId)
  } else {
    await handleUnsubscribe(req, res, supabase, userId)
  }
}

/**
 * Handle POST - Subscribe to push notifications
 */
async function handleSubscribe(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  supabase: ReturnType<typeof createPagesServerClient<Database>>,
  userId: string
): Promise<void> {
  const body = req.body as Record<string, unknown>
  const subscriptionRaw = body.subscription

  // Validate subscription structure
  if (!isPlainObject(subscriptionRaw)) {
    res.status(400).json({ success: false, error: 'Invalid subscription data' })
    return
  }

  // Validate endpoint
  const endpointValidation = validateEndpoint(subscriptionRaw.endpoint)
  if (!endpointValidation.valid) {
    res.status(400).json({ success: false, error: endpointValidation.error })
    return
  }

  // Validate keys
  const keysRaw = subscriptionRaw.keys
  if (!isPlainObject(keysRaw)) {
    res.status(400).json({ success: false, error: 'Invalid subscription keys' })
    return
  }

  const p256dhValidation = validateKey(keysRaw.p256dh, MAX_P256DH_LENGTH, 'p256dh')
  if (!p256dhValidation.valid) {
    res.status(400).json({ success: false, error: p256dhValidation.error })
    return
  }

  const authValidation = validateKey(keysRaw.auth, MAX_AUTH_LENGTH, 'auth')
  if (!authValidation.valid) {
    res.status(400).json({ success: false, error: authValidation.error })
    return
  }

  try {
    // At this point, all validations passed so sanitized values are guaranteed to exist
    const endpoint = endpointValidation.sanitized as string
    const p256dh = p256dhValidation.sanitized as string
    const auth = authValidation.sanitized as string

    // Upsert web push subscription with validated/sanitized values
    const { error: upsertError } = await supabase.rpc('upsert_web_push_token', {
      p_endpoint: endpoint,
      p_p256dh: p256dh,
      p_auth: auth,
    })

    if (upsertError) {
      // Log error without sensitive data (no tokens/keys)
      console.error('[Web Push Subscribe] Database error:', {
        code: upsertError.code,
        message: upsertError.message,
        userId: `${userId.substring(0, 8)}...`,
      })
      res.status(500).json({ success: false, error: 'Failed to save subscription' })
      return
    }

    res
      .status(200)
      .json({ success: true, message: 'Successfully subscribed to push notifications' })
  } catch (error) {
    // Log error without sensitive data
    console.error('[Web Push Subscribe] Unexpected error:', {
      type: error instanceof Error ? error.name : 'Unknown',
      userId: `${userId.substring(0, 8)}...`,
    })
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
}

/**
 * Handle DELETE - Unsubscribe from push notifications
 */
async function handleUnsubscribe(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>,
  supabase: ReturnType<typeof createPagesServerClient<Database>>,
  userId: string
): Promise<void> {
  const body = req.body as Record<string, unknown>

  // Validate endpoint
  const endpointValidation = validateEndpoint(body.endpoint)
  if (!endpointValidation.valid) {
    res.status(400).json({ success: false, error: endpointValidation.error || 'Invalid endpoint' })
    return
  }

  // At this point, validation passed so sanitized value is guaranteed to exist
  const endpoint = endpointValidation.sanitized as string

  try {
    const { error: deleteError } = await supabase
      .from('push_tokens')
      .delete()
      .eq('user_id', userId)
      .eq('platform', 'web')
      .eq('endpoint', endpoint)

    if (deleteError) {
      // Log error without sensitive data
      console.error('[Web Push Unsubscribe] Database error:', {
        code: deleteError.code,
        message: deleteError.message,
        userId: `${userId.substring(0, 8)}...`,
      })
      res.status(500).json({ success: false, error: 'Failed to remove subscription' })
      return
    }

    res
      .status(200)
      .json({ success: true, message: 'Successfully unsubscribed from push notifications' })
  } catch (error) {
    // Log error without sensitive data
    console.error('[Web Push Unsubscribe] Unexpected error:', {
      type: error instanceof Error ? error.name : 'Unknown',
      userId: `${userId.substring(0, 8)}...`,
    })
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
}
