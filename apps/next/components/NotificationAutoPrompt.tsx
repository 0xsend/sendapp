'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import debug from 'debug'
import { useMedia, View } from '@my/ui'

import { useSessionContext } from 'app/utils/supabase/useSessionContext'

import { NotificationPrompt } from './NotificationPrompt'
import { useWebPush } from './WebPushSubscription'

const log = debug('app:web-push:auto-sync')

const RETRY_DELAYS_MS = [1000, 5000, 15000] as const
const MAX_RETRIES = RETRY_DELAYS_MS.length // 3 retries, 4 total attempts

/**
 * Returns true if the error is a network failure (fetch threw) or HTTP 5xx.
 * Does NOT retry on 4xx or 429.
 */
function isRetryableError(error: unknown, status?: number): boolean {
  // Network failure (fetch threw)
  if (error instanceof TypeError) return true
  // HTTP 5xx
  if (status !== undefined && status >= 500 && status < 600) return true
  return false
}

/**
 * Runs an async operation with exponential backoff delays.
 * Retries only on network failures (fetch throws) and HTTP 5xx responses.
 * Does not retry on 4xx or 429.
 */
async function syncWithRetry(
  operation: () => Promise<Response>,
  source: string
): Promise<Response | null> {
  let lastError: unknown = null
  let lastStatus: number | undefined

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await operation()
      lastStatus = response.status

      // Success or non-retryable error (4xx, 429)
      if (response.ok || (response.status >= 400 && response.status < 500)) {
        if (!response.ok) {
          log('Sync failed (not retrying)', { source, status: response.status, attempt })
        }
        return response
      }

      // 5xx - retryable
      if (!isRetryableError(null, response.status)) {
        return response
      }

      lastError = new Error(`HTTP ${response.status}`)
    } catch (err) {
      // Network failure
      lastError = err
      lastStatus = undefined
    }

    // Check if we should retry
    if (attempt < MAX_RETRIES && isRetryableError(lastError, lastStatus)) {
      const waitMs = RETRY_DELAYS_MS[attempt]
      log('Sync retrying', { source, attempt: attempt + 1, waitMs, status: lastStatus })
      await new Promise((resolve) => setTimeout(resolve, waitMs))
    }
  }

  // All retries exhausted
  log('Sync failed after retries', {
    source,
    attempts: MAX_RETRIES + 1,
    status: lastStatus,
  })
  return null
}

// Must match apps/next/public/service_worker.js
const ALLOWED_SW_MESSAGE_TYPES = Object.freeze(['PUSH_SUBSCRIPTION_CHANGED'] as const)
type AllowedSwMessageType = (typeof ALLOWED_SW_MESSAGE_TYPES)[number]

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function validateServiceWorkerMessage(event: MessageEvent): AllowedSwMessageType | null {
  const data = event.data
  if (!isPlainObject(data)) return null

  const type = data.type
  if (typeof type !== 'string') return null

  if (!(ALLOWED_SW_MESSAGE_TYPES as readonly string[]).includes(type)) return null
  return type as AllowedSwMessageType
}

async function getReadyRegistration(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined') return null
  if (!('serviceWorker' in navigator)) return null

  try {
    return await navigator.serviceWorker.ready
  } catch {
    return null
  }
}

/**
 * Automatically shows notification permission prompt after user logs in.
 *
 * Shows a UI banner that allows user to enable notifications if:
 * - User is authenticated
 * - Browser supports notifications
 * - Permission hasn't been requested yet (state is 'prompt')
 * - User hasn't denied permission
 * - This is a new session (hasn't seen banner this session)
 *
 * Also best-effort re-syncs the current PushSubscription to the backend when:
 * - a user logs in (no user-visible side effects)
 * - the service worker notifies us of a rotated subscription
 *
 * Note: Requires user interaction to request permission (browser security requirement)
 */
export function NotificationAutoPrompt() {
  const media = useMedia()
  const { session } = useSessionContext()
  const { permission, isSupported, isSubscribed } = useWebPush()

  const hasShown = useRef(false)
  const [showBanner, setShowBanner] = useState(false)

  const userIdRef = useRef<string | null>(null)
  const syncInFlight = useRef(false)
  const lastSyncAtMs = useRef<number>(0)

  useEffect(() => {
    userIdRef.current = session?.user?.id ?? null
  }, [session?.user?.id])

  const syncCurrentSubscription = useCallback(
    async (source: 'login' | 'subscriptionchange'): Promise<void> => {
      if (syncInFlight.current) return
      if (!userIdRef.current) return

      // Simple debounce to avoid loops when multiple windows are open.
      const now = Date.now()
      if (now - lastSyncAtMs.current < 5_000) return
      lastSyncAtMs.current = now

      syncInFlight.current = true
      try {
        const reg = await getReadyRegistration()
        if (!reg) return

        const subscription = await reg.pushManager.getSubscription()
        if (!subscription) return

        await syncWithRetry(
          () =>
            fetch('/api/notifications/subscribe', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'same-origin',
              cache: 'no-store',
              body: JSON.stringify({
                subscription: subscription.toJSON(),
              }),
            }),
          source
        )
      } finally {
        syncInFlight.current = false
      }
    },
    []
  )

  // On login, attempt to sync any existing subscription (no user-visible side effects).
  useEffect(() => {
    if (!session?.user?.id) return
    void syncCurrentSubscription('login')
  }, [session?.user?.id, syncCurrentSubscription])

  // Listen for subscription-change messages from the service worker.
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return

    const handleMessage = (event: MessageEvent) => {
      const validatedType = validateServiceWorkerMessage(event)
      if (validatedType === 'PUSH_SUBSCRIPTION_CHANGED') {
        void syncCurrentSubscription('subscriptionchange')
      }
    }

    navigator.serviceWorker.addEventListener('message', handleMessage)
    return () => navigator.serviceWorker.removeEventListener('message', handleMessage)
  }, [syncCurrentSubscription])

  useEffect(() => {
    // Don't show banner if:
    // - Already shown this session
    // - Not supported
    // - User not authenticated
    // - Permission already requested or denied
    // - Already subscribed
    if (
      hasShown.current ||
      !isSupported ||
      !session?.user ||
      permission !== 'prompt' ||
      isSubscribed
    ) {
      return
    }

    // Add a small delay to avoid interrupting login flow
    const timer = setTimeout(() => {
      hasShown.current = true
      setShowBanner(true)
    }, 2000) // 2 second delay after login

    return () => clearTimeout(timer)
  }, [session?.user, permission, isSupported, isSubscribed])

  if (!showBanner) {
    return null
  }

  return (
    <View
      position="absolute"
      right={20}
      maxWidth={400}
      zIndex={9999}
      {...(media.gtMd ? { bottom: 20, marginTop: 'auto' } : { top: 20, marginBottom: 'auto' })}
    >
      <NotificationPrompt
        onDismiss={() => setShowBanner(false)}
        title="Enable notifications"
        description="Get notified instantly when you receive payments"
      />
    </View>
  )
}
