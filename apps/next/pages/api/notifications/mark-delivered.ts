import { createPagesServerClient } from '@supabase/auth-helpers-nextjs'
import type { NextApiRequest, NextApiResponse } from 'next'
import type { Database } from '@my/supabase/database.types'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4kb',
    },
  },
}

const MAX_IDS_PER_REQUEST = 100
const MAX_BODY_SIZE = 4 * 1024

type ApiResponse = {
  success: boolean
  message?: string
  error?: string
  updated?: number
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function validateSameOrigin(req: NextApiRequest): boolean {
  const host = req.headers.host
  if (!host) return false

  const origin = req.headers.origin
  if (origin) {
    try {
      const originUrl = new URL(origin)
      if (originUrl.protocol !== 'https:' && originUrl.protocol !== 'http:') {
        return false
      }
      if (originUrl.host === host) return true
      return originUrl.hostname === host.split(':')[0]
    } catch {
      return false
    }
  }

  const referer = req.headers.referer
  if (referer) {
    try {
      const refererUrl = new URL(referer)
      if (refererUrl.protocol !== 'https:' && refererUrl.protocol !== 'http:') {
        return false
      }
      if (refererUrl.host === host) return true
      return refererUrl.hostname === host.split(':')[0]
    } catch {
      return false
    }
  }

  return false
}

function validateRequestBody(body: unknown): { valid: boolean; error?: string } {
  if (body === null || body === undefined) {
    return { valid: false, error: 'Request body is required' }
  }

  if (!isPlainObject(body)) {
    return { valid: false, error: 'Request body must be an object' }
  }

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

function parseNotificationIds(body: Record<string, unknown>): {
  valid: boolean
  ids?: number[]
  error?: string
} {
  // Accept either { id: number } or { ids: number[] }
  if ('id' in body && body.id !== undefined) {
    const id = body.id
    if (typeof id !== 'number' || !Number.isInteger(id) || id <= 0) {
      return { valid: false, error: 'id must be a positive integer' }
    }
    return { valid: true, ids: [id] }
  }

  if ('ids' in body && body.ids !== undefined) {
    const ids = body.ids
    if (!Array.isArray(ids)) {
      return { valid: false, error: 'ids must be an array' }
    }
    if (ids.length === 0) {
      return { valid: false, error: 'ids array must not be empty' }
    }
    if (ids.length > MAX_IDS_PER_REQUEST) {
      return { valid: false, error: `ids array must not exceed ${MAX_IDS_PER_REQUEST} items` }
    }
    for (const id of ids) {
      if (typeof id !== 'number' || !Number.isInteger(id) || id <= 0) {
        return { valid: false, error: 'All ids must be positive integers' }
      }
    }
    return { valid: true, ids: ids as number[] }
  }

  return { valid: false, error: 'Request must include id or ids' }
}

/**
 * API route for marking notifications as delivered
 *
 * POST: Mark one or more notifications as delivered
 *   - Body: { id: number } or { ids: number[] }
 *   - Updates delivered_at timestamp for matching notification(s)
 *   - RLS ensures users can only update their own notifications
 *
 * Security measures:
 * - Method validation
 * - Same-origin validation (Origin/Referer)
 * - Request body size limits
 * - Input validation
 * - RLS prevents cross-user updates
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
): Promise<void> {
  res.setHeader('Cache-Control', 'no-store')

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    res.status(405).json({ success: false, error: 'Method not allowed' })
    return
  }

  if (!validateSameOrigin(req)) {
    res.status(403).json({ success: false, error: 'Forbidden' })
    return
  }

  const contentType = req.headers['content-type']
  if (typeof contentType !== 'string' || !contentType.toLowerCase().includes('application/json')) {
    res.status(415).json({ success: false, error: 'Content-Type must be application/json' })
    return
  }

  const bodyValidation = validateRequestBody(req.body)
  if (!bodyValidation.valid) {
    res.status(400).json({ success: false, error: bodyValidation.error })
    return
  }

  const supabase = createPagesServerClient<Database>({ req, res })

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError || !session?.user) {
    res.status(401).json({ success: false, error: 'Unauthorized' })
    return
  }

  const userId = session.user.id
  const body = req.body as Record<string, unknown>

  const idsValidation = parseNotificationIds(body)
  if (!idsValidation.valid || !idsValidation.ids) {
    res.status(400).json({ success: false, error: idsValidation.error })
    return
  }

  try {
    // Update delivered_at for matching notifications
    // RLS policy ensures only the user's own notifications are updated
    const { data, error: updateError } = await supabase
      .from('notifications')
      .update({ delivered_at: new Date().toISOString() })
      .eq('user_id', userId)
      .in('id', idsValidation.ids)
      .is('delivered_at', null)
      .select('id')

    if (updateError) {
      console.error('[Mark Delivered] Database error:', {
        code: updateError.code,
        message: updateError.message,
        userId: `${userId.substring(0, 8)}...`,
      })
      res.status(500).json({ success: false, error: 'Failed to mark notifications as delivered' })
      return
    }

    const updatedCount = data?.length ?? 0
    res.status(200).json({
      success: true,
      message: `Marked ${updatedCount} notification(s) as delivered`,
      updated: updatedCount,
    })
  } catch (error) {
    console.error('[Mark Delivered] Unexpected error:', {
      type: error instanceof Error ? error.name : 'Unknown',
      userId: `${userId.substring(0, 8)}...`,
    })
    res.status(500).json({ success: false, error: 'Internal server error' })
  }
}
