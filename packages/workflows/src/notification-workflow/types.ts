import type { Database } from '@my/supabase/database.types'
import type { Address } from 'viem'

// Push notification payload size limits
// APNs limit is 4KB total; we target smaller to leave room for other payload fields
export const MAX_NOTE_LENGTH = 256
export const MAX_BODY_LENGTH = 500
export const MAX_TITLE_LENGTH = 100

// Database types
export type Notification = Database['public']['Tables']['notifications']['Row']
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert']
export type NotificationUpdate = Database['public']['Tables']['notifications']['Update']
export type NotificationType = Database['public']['Enums']['notification_type']

// Base PushToken type from database, extended with web push fields
// The web push fields (endpoint, p256dh, auth) are nullable and used for platform='web'
export type PushToken = Database['public']['Tables']['push_tokens']['Row'] & {
  // Web Push specific fields (nullable, used when platform='web')
  endpoint?: string | null
  p256dh?: string | null
  auth?: string | null
}
export type PushPlatform = Database['public']['Enums']['push_token_platform']

// Activity input types
export type TransferNotificationParams = {
  senderAddress: Address
  recipientAddress: Address
  amount: string // BigInt as string
  token: Address | null // null for ETH
  txHash: string
  note?: string
  /** Workflow ID for idempotency - prevents duplicate notifications on retries */
  workflowId?: string
}

export type PushNotificationPayload = {
  userId: string
  title: string
  body: string
  data?: Record<string, unknown>
}

export type InAppNotificationPayload = {
  userId: string
  type: NotificationType
  title: string
  body: string
  data?: Record<string, unknown>
}

// Activity result types
export type SendPushResult = {
  success: boolean
  sent: number
  failed: number
  errors?: string[]
  /** Number of notifications skipped due to missing configuration (e.g., VAPID keys) */
  skipped?: number
}

export type CreateNotificationResult = {
  id: number
  created: boolean
}

// Expo Push types
export type ExpoPushMessage = {
  to: string
  sound?: 'default' | null
  title?: string
  body?: string
  data?: Record<string, unknown>
  priority?: 'default' | 'normal' | 'high'
  channelId?: string
}

export type ExpoPushTicket =
  | { status: 'ok'; id: string }
  | {
      status: 'error'
      message: string
      details?: { error?: 'DeviceNotRegistered' | 'InvalidCredentials' | string }
    }
