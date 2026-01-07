'use client'

import { useCallback, useEffect, useRef } from 'react'
import debug from 'debug'

import { useSessionContext } from 'app/utils/supabase/useSessionContext'

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
 * Global helper that listens for SW subscription-change messages and, when a user is logged in,
 * best-effort re-syncs the current PushSubscription to the backend.
 *
 * IMPORTANT: This component intentionally does NOT call Notification.requestPermission().
 * Browsers expect permission prompts to be triggered by an explicit user gesture.
 */
export function NotificationAutoPrompt(): React.ReactNode {
  const { session } = useSessionContext()

  const userIdRef = useRef<string | null>(null)
  const syncInFlight = useRef(false)
  const lastSyncAtMs = useRef<number>(0)

  useEffect(() => {
    userIdRef.current = session?.user?.id ?? null
  }, [session?.user?.id])

  const syncCurrentSubscription = useCallback(
    async (source: 'login' | 'subscriptionchange'): Promise<void> => {
      if (syncInFlight.current) return

      const userId = userIdRef.current
      if (!userId) return

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

  return null
}
