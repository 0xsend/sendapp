'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import debug from 'debug'
import { useMedia, View } from '@my/ui'

import { useSessionContext } from 'app/utils/supabase/useSessionContext'

import { NotificationPrompt } from './NotificationPrompt'
import { useWebPush } from './WebPushSubscription'

const log = debug('app:web-push:auto-sync')

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

        const response = await fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'same-origin',
          cache: 'no-store',
          body: JSON.stringify({
            subscription: subscription.toJSON(),
          }),
        })

        if (!response.ok) {
          // Avoid logging any sensitive payload (endpoints/keys).
          log('Auto-sync failed', { source, status: response.status })
        }
      } catch (err) {
        log('Auto-sync error', { source, err })
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
