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
 * Gets user main tag name for formatting notification messages.
 * @deprecated Use getSendAccountMainTagName instead for address-based lookup
 * that properly uses send_accounts.main_tag_id.
 */
export async function getUserMainTagName(userId: string): Promise<string | null> {
  if (!userId) return null

  const supabaseAdmin = createSupabaseAdminClient()

  // Query via send_accounts.main_tag_id join to get the canonical main tag
  const { data: accountData, error: accountError } = await supabaseAdmin
    .from('send_accounts')
    .select('main_tag:tags!send_accounts_main_tag_id_fkey(name)')
    .eq('user_id', userId)
    .maybeSingle()

  if (accountError) {
    log.warn('Error fetching main tag for user:', {
      userId: redactId(userId),
      error: accountError,
      errorMessage: accountError.message,
      errorCode: accountError.code,
    })
    return null
  }

  if (!accountData) {
    log.info('No send account found for user:', { userId: redactId(userId) })
    return null
  }

  // main_tag can be null if no main tag is set, or an object with name
  const mainTag = accountData.main_tag as { name: string } | null
  if (!mainTag?.name) {
    log.info('No main tag set for user send account:', { userId: redactId(userId) })
    return null
  }

  return mainTag.name
}

/**
 * Gets the main tag name for a send account by address.
 * Uses send_accounts.main_tag_id to fetch the canonical main tag.
 * This is the preferred method when the address is available.
 */
export async function getSendAccountMainTagName(address: Address): Promise<string | null> {
  if (!address) {
    log.warn('getSendAccountMainTagName: received empty address')
    return null
  }

  const supabaseAdmin = createSupabaseAdminClient()

  // Query send_accounts with a join to tags via main_tag_id foreign key
  const { data: accountData, error: accountError } = await supabaseAdmin
    .from('send_accounts')
    .select('main_tag:tags!send_accounts_main_tag_id_fkey(name)')
    .eq('address', address)
    .maybeSingle()

  if (accountError) {
    log.warn('Error fetching main tag for address:', {
      address: redactHex(address),
      error: accountError,
      errorMessage: accountError.message,
      errorCode: accountError.code,
    })
    return null
  }

  if (!accountData) {
    log.info('No send account found for address:', { address: redactHex(address) })
    return null
  }

  // main_tag can be null if no main tag is set, or an object with name
  const mainTag = accountData.main_tag as { name: string } | null
  if (!mainTag?.name) {
    log.info('No main tag set for send account:', { address: redactHex(address) })
    return null
  }

  log.info('Found main tag for address:', {
    address: redactHex(address),
    tagName: mainTag.name,
  })

  return mainTag.name
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
