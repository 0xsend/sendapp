import { createSupabaseAdminClient } from 'app/utils/supabase/admin'
import { log } from '@temporalio/activity'
import type { Address } from 'viem'
import type { NotificationInsert, PushToken } from './types'
import type { Json } from '@my/supabase/database.types'

function redactId(id: string): string {
  if (!id) return ''
  return id.length > 12 ? `${id.slice(0, 8)}...` : `${id.slice(0, 4)}...`
}

function redactHex(value: string): string {
  if (typeof value !== 'string') return ''
  if (value.length <= 14) return value
  return `${value.slice(0, 8)}...${value.slice(-6)}`
}

/**
 * Retrieves push tokens for a user by their user_id.
 * Returns both Expo and Web push tokens.
 */
export async function getUserPushTokens(userId: string): Promise<PushToken[]> {
  if (!userId) {
    log.warn('getUserPushTokens: received empty userId')
    return []
  }

  const supabaseAdmin = createSupabaseAdminClient()
  const { data, error } = await supabaseAdmin
    .from('push_tokens')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)

  if (error) {
    log.error('Error fetching push tokens:', { userId: redactId(userId), error })
    return []
  }

  return data || []
}

/**
 * Retrieves the user_id associated with a given Send Account address.
 */
export async function getUserIdFromAddress(address: Address): Promise<string | null> {
  if (!address) {
    log.warn('getUserIdFromAddress: received empty address')
    return null
  }

  const supabaseAdmin = createSupabaseAdminClient()
  const { data, error } = await supabaseAdmin
    .from('send_accounts')
    .select('user_id')
    .eq('address', address)
    .maybeSingle()

  if (error) {
    log.error('Error fetching user_id for address:', { address: redactHex(address), error })
    return null
  }

  if (!data) {
    log.warn('No user_id found for address:', { address: redactHex(address) })
    return null
  }

  return data.user_id
}

/**
 * Creates an in-app notification in the notifications table.
 */
export async function createNotification(notification: NotificationInsert): Promise<{
  data: { id: number } | null
  error: { code?: string; message: string } | null
}> {
  const { user_id, type, title, body, data } = notification

  if (!user_id || !type || !title || !body) {
    return {
      data: null,
      error: new Error('user_id, type, title, and body are required'),
    }
  }

  const supabaseAdmin = createSupabaseAdminClient()
  const { data: insertedData, error } = await supabaseAdmin
    .from('notifications')
    .insert({
      user_id,
      type,
      title,
      body,
      data: data || null,
      read: false,
    })
    .select('id')
    .single()

  if (error) {
    log.error('Error creating notification:', { user_id: redactId(user_id), type, error })
    return { data: null, error }
  }

  return { data: insertedData, error: null }
}

/**
 * Gets user main tag name for formatting notification messages
 */
export async function getUserMainTagName(userId: string): Promise<string | null> {
  if (!userId) return null

  const supabaseAdmin = createSupabaseAdminClient()
  // Get the user's main tag
  const { data: tagData, error: tagError } = await supabaseAdmin
    .from('tags')
    .select('name')
    .eq('user_id', userId)
    .maybeSingle()

  if (tagError) {
    log.warn('Error fetching tag for user:', { userId: redactId(userId), error: tagError })
    return null
  }

  return tagData?.name || null
}

/**
 * Marks a push token as inactive (e.g., when device is no longer registered or token is invalid).
 * This is preferred over deletion to maintain audit history.
 */
export async function markTokenInactive(tokenId: number): Promise<boolean> {
  if (tokenId === undefined || tokenId === null) {
    log.warn('markTokenInactive: received invalid tokenId')
    return false
  }

  const supabaseAdmin = createSupabaseAdminClient()
  const { error } = await supabaseAdmin
    .from('push_tokens')
    .update({ is_active: false })
    .eq('id', tokenId)

  if (error) {
    log.error('Error marking push token inactive:', { tokenId, error })
    return false
  }

  log.info('Marked push token as inactive', { tokenId })
  return true
}
