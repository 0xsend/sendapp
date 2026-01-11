'use client'

import { useCallback, useEffect, useState, useRef } from 'react'
import { useSessionContext } from 'app/utils/supabase/useSessionContext'
import debug from 'debug'

const log = debug('app:web-push')

// VAPID public key - must match the server's VAPID_PUBLIC_KEY
// This is set via environment variable at build time
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

// ============================================================================
// Security Constants
// ============================================================================

/** Allowed message types from service worker (must match service worker) */
const ALLOWED_SW_MESSAGE_TYPES = Object.freeze(['PUSH_SUBSCRIPTION_CHANGED'] as const)

/** Service worker path (relative to origin) */
const SERVICE_WORKER_PATH = '/service_worker.js'

/** Service worker scope */
const SERVICE_WORKER_SCOPE = '/'

export type WebPushPermissionState = 'prompt' | 'granted' | 'denied' | 'unsupported'

export interface UseWebPushResult {
  /** Current permission state */
  permission: WebPushPermissionState
  /** Whether push notifications are currently subscribed */
  isSubscribed: boolean
  /** Whether a subscription operation is in progress */
  isLoading: boolean
  /** Error message if any */
  error: string | null
  /** Whether Web Push API is supported */
  isSupported: boolean
  /** Subscribe to push notifications */
  subscribe: () => Promise<boolean>
  /** Unsubscribe from push notifications */
  unsubscribe: () => Promise<boolean>
  /** Request notification permission */
  requestPermission: () => Promise<boolean>
}

// ============================================================================
// Validation Helpers
// ============================================================================

/**
 * Safely check if value is a non-null object (not array)
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Validate a service worker message event
 * Returns the validated message type or null if invalid
 */
function validateServiceWorkerMessage(
  event: MessageEvent
): (typeof ALLOWED_SW_MESSAGE_TYPES)[number] | null {
  // Must have data
  if (!event.data) return null

  // Data must be a plain object
  if (!isPlainObject(event.data)) return null

  // Type must exist and be a string
  const messageType = event.data.type
  if (typeof messageType !== 'string') return null

  // Type must be in allowlist
  if (
    !ALLOWED_SW_MESSAGE_TYPES.includes(messageType as (typeof ALLOWED_SW_MESSAGE_TYPES)[number])
  ) {
    log('Received unknown message type from service worker:', messageType)
    return null
  }

  return messageType as (typeof ALLOWED_SW_MESSAGE_TYPES)[number]
}

/**
 * Convert a base64 string to Uint8Array for VAPID key
 * Validates input to prevent injection attacks
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  // Validate input is a string
  if (typeof base64String !== 'string') {
    throw new Error('Invalid VAPID key format')
  }

  // Basic length/format validation for VAPID keys (typically ~87 chars base64url)
  if (base64String.length < 40 || base64String.length > 150) {
    throw new Error('Invalid VAPID key length')
  }

  // Only allow base64url characters
  if (!/^[A-Za-z0-9_-]+$/.test(base64String)) {
    throw new Error('Invalid VAPID key characters')
  }

  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

/**
 * Check if Web Push API is supported in the current browser
 */
function checkWebPushSupport(): boolean {
  if (typeof window === 'undefined') return false
  if (!('serviceWorker' in navigator)) return false
  if (!('PushManager' in window)) return false
  if (!('Notification' in window)) return false
  return true
}

/**
 * Hook for managing Web Push notifications on web platform.
 *
 * Handles:
 * - Service worker registration
 * - Push permission requests
 * - Push subscription management
 * - Backend registration via API route
 */
export function useWebPush(): UseWebPushResult {
  const { session } = useSessionContext()
  const [permission, setPermission] = useState<WebPushPermissionState>('prompt')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  // Track if service worker registration has been attempted to prevent duplicates
  const registrationAttempted = useRef(false)

  const isSupported = checkWebPushSupport()

  /**
   * Best-effort sync of a PushSubscription to the backend.
   *
   * This is intentionally silent (no user-facing error state) because it is used
   * for background repair flows like subscription rotation.
   */
  const syncSubscriptionToBackend = useCallback(
    async (
      subscription: PushSubscription,
      source: 'init' | 'subscriptionchange'
    ): Promise<void> => {
      const userId = session?.user?.id
      if (!userId) return

      try {
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
          // Avoid logging any sensitive payload (endpoints/keys). Log only status and a safe error string.
          let safeError: string | undefined
          try {
            const data: unknown = await response.json()
            if (isPlainObject(data) && typeof data.error === 'string') {
              safeError = data.error
            }
          } catch {
            // ignore
          }

          log('Failed to sync subscription to backend', {
            source,
            status: response.status,
            error: safeError,
          })
        }
      } catch (err) {
        log('Error syncing subscription to backend', { source, err })
      }
    },
    [session?.user?.id]
  )

  // Check initial permission state and existing subscription
  useEffect(() => {
    if (!isSupported) {
      setPermission('unsupported')
      return
    }

    // Check notification permission
    // Note: Some browsers use 'default' instead of 'prompt' for initial state
    const notificationPermission = Notification.permission
    const normalizedPermission =
      notificationPermission === 'default' ? 'prompt' : notificationPermission
    setPermission(normalizedPermission as WebPushPermissionState)

    // Register service worker and check existing subscription
    // Only attempt once to prevent duplicate registrations
    const initServiceWorker = async () => {
      // Prevent duplicate registration attempts
      if (registrationAttempted.current) return
      registrationAttempted.current = true

      try {
        // First check if there's an existing registration with correct scope
        const existingReg = await navigator.serviceWorker.getRegistration(SERVICE_WORKER_SCOPE)

        if (existingReg) {
          // Validate the existing registration is our service worker
          const swUrl = existingReg.active?.scriptURL || existingReg.installing?.scriptURL
          if (swUrl && new URL(swUrl).pathname === SERVICE_WORKER_PATH) {
            setRegistration(existingReg)
            log('Using existing service worker registration:', existingReg.scope)

            // Check for existing subscription
            const existingSubscription = await existingReg.pushManager.getSubscription()
            setIsSubscribed(!!existingSubscription)
            log('Existing subscription:', existingSubscription ? 'yes' : 'no')
            return
          }
        }

        // Register new service worker
        const reg = await navigator.serviceWorker.register(SERVICE_WORKER_PATH, {
          scope: SERVICE_WORKER_SCOPE,
        })
        setRegistration(reg)
        log('Service worker registered:', reg.scope)

        // Check for existing subscription
        const existingSubscription = await reg.pushManager.getSubscription()
        setIsSubscribed(!!existingSubscription)
        log('Existing subscription:', existingSubscription ? 'yes' : 'no')
      } catch (err) {
        log('Service worker registration failed:', err)
        setError('Failed to register service worker')
        // Reset flag to allow retry on next mount if needed
        registrationAttempted.current = false
      }
    }

    void initServiceWorker()
  }, [isSupported])

  // When a user logs in, best-effort sync any existing subscription to the backend.
  useEffect(() => {
    if (!session?.user?.id) return
    if (!registration) return

    void (async () => {
      try {
        const subscription = await registration.pushManager.getSubscription()
        if (subscription) {
          await syncSubscriptionToBackend(subscription, 'init')
        }
      } catch (err) {
        log('Error syncing existing subscription after login:', err)
      }
    })()
  }, [session?.user?.id, registration, syncSubscriptionToBackend])

  // Listen for permission changes via PermissionStatus API (when available)
  // This is more efficient than polling and is the standard approach
  useEffect(() => {
    if (!isSupported) return

    let permissionStatus: PermissionStatus | null = null
    let handlePermissionChange: (() => void) | null = null

    const setupPermissionListener = async () => {
      try {
        // Use the Permissions API if available (more efficient than polling)
        if ('permissions' in navigator) {
          permissionStatus = await navigator.permissions.query({ name: 'notifications' })

          handlePermissionChange = () => {
            const state = permissionStatus?.state
            if (state === 'granted' || state === 'denied') {
              setPermission(state)
            } else {
              setPermission('prompt')
            }
          }

          permissionStatus.addEventListener('change', handlePermissionChange)
          // Set initial state
          handlePermissionChange()
        }
      } catch {
        // Permissions API not available, fall back to Notification.permission
        // This is okay - we just won't get live updates
        log('Permissions API not available')
      }
    }

    void setupPermissionListener()

    return () => {
      if (permissionStatus && handlePermissionChange) {
        permissionStatus.removeEventListener('change', handlePermissionChange)
      }
    }
  }, [isSupported])

  const checkSubscriptionStatus = useCallback(
    async ({ syncToBackend = false }: { syncToBackend?: boolean } = {}): Promise<void> => {
      // Prefer a ready/active registration when possible.
      let reg: ServiceWorkerRegistration | null = registration

      if (!reg) {
        try {
          reg = await navigator.serviceWorker.getRegistration(SERVICE_WORKER_SCOPE)
        } catch {
          // ignore
        }
      }

      if (!reg) {
        try {
          reg = await navigator.serviceWorker.ready
        } catch {
          // ignore
        }
      }

      if (!reg) return

      try {
        const subscription = await reg.pushManager.getSubscription()
        setIsSubscribed(!!subscription)

        if (subscription && syncToBackend) {
          await syncSubscriptionToBackend(subscription, 'subscriptionchange')
        }
      } catch (err) {
        log('Error checking subscription status:', err)
      }
    },
    [registration, syncSubscriptionToBackend]
  )

  // Listen for subscription change messages from service worker
  // With strict message validation
  useEffect(() => {
    if (!isSupported) return

    const handleMessage = (event: MessageEvent) => {
      // Validate the message is from our service worker
      // Note: event.source may be the ServiceWorker, but it's not always reliable
      // The best we can do is validate the message format
      const validatedType = validateServiceWorkerMessage(event)

      if (validatedType === 'PUSH_SUBSCRIPTION_CHANGED') {
        log('Push subscription changed, refreshing subscription status...')
        void checkSubscriptionStatus({ syncToBackend: true })
      }
      // Silently ignore other message types (already logged in validator)
    }

    navigator.serviceWorker.addEventListener('message', handleMessage)
    return () => navigator.serviceWorker.removeEventListener('message', handleMessage)
  }, [isSupported, checkSubscriptionStatus])

  /**
   * Request notification permission from the user
   */
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('Web Push is not supported in this browser')
      return false
    }

    setError(null)

    try {
      const result = await Notification.requestPermission()
      setPermission(result as WebPushPermissionState)
      return result === 'granted'
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to request permission'
      log('Permission request failed:', err)
      setError(errMsg)
      return false
    }
  }, [isSupported])

  /**
   * Subscribe to push notifications
   */
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('Web Push is not supported in this browser')
      return false
    }

    if (!VAPID_PUBLIC_KEY) {
      setError('VAPID public key not configured')
      log('VAPID_PUBLIC_KEY not set')
      return false
    }

    if (!session?.user) {
      setError('User not authenticated')
      return false
    }

    if (!registration) {
      setError('Service worker not registered')
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      // First ensure we have permission
      if (Notification.permission !== 'granted') {
        const granted = await requestPermission()
        if (!granted) {
          setIsLoading(false)
          return false
        }
      }

      // Create push subscription
      log('Creating push subscription...')
      const readyRegistration = registration.active
        ? registration
        : await navigator.serviceWorker.ready

      const subscription = await readyRegistration.pushManager.subscribe({
        userVisibleOnly: true, // Required: ensures notifications are visible
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })

      log('Push subscription created')

      // Send subscription to backend
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
        const data = await response.json()
        throw new Error(data.error || 'Failed to save subscription')
      }

      setIsSubscribed(true)
      log('Successfully subscribed to push notifications')
      return true
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to subscribe'
      log('Subscribe failed:', err)
      setError(errMsg)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [isSupported, session?.user, registration, requestPermission])

  /**
   * Unsubscribe from push notifications
   */
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !registration) {
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      const readyRegistration = registration.active
        ? registration
        : await navigator.serviceWorker.ready

      const subscription = await readyRegistration.pushManager.getSubscription()

      if (!subscription) {
        setIsSubscribed(false)
        return true
      }

      // Unsubscribe from push manager
      await subscription.unsubscribe()

      // Remove from backend
      const response = await fetch('/api/notifications/subscribe', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        cache: 'no-store',
        body: JSON.stringify({
          endpoint: subscription.endpoint,
        }),
      })

      if (!response.ok) {
        log('Warning: Failed to remove subscription from backend')
        // Don't throw - local unsubscribe succeeded
      }

      setIsSubscribed(false)
      log('Successfully unsubscribed from push notifications')
      return true
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to unsubscribe'
      log('Unsubscribe failed:', err)
      setError(errMsg)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [isSupported, registration])

  return {
    permission,
    isSubscribed,
    isLoading,
    error,
    isSupported,
    subscribe,
    unsubscribe,
    requestPermission,
  }
}

export interface WebPushSubscriptionProps {
  /** Called when subscription status changes */
  onSubscriptionChange?: (isSubscribed: boolean) => void
  /** Called when an error occurs */
  onError?: (error: string) => void
  /** Render prop for custom UI */
  children?: (props: UseWebPushResult) => React.ReactNode
}

/**
 * Component wrapper for web push subscription management.
 * Use the render prop pattern to provide custom UI.
 *
 * @example
 * ```tsx
 * <WebPushSubscription>
 *   {({ isSupported, isSubscribed, subscribe, unsubscribe, permission, isLoading }) => (
 *     <button
 *       onClick={isSubscribed ? unsubscribe : subscribe}
 *       disabled={!isSupported || isLoading || permission === 'denied'}
 *     >
 *       {isSubscribed ? 'Disable Notifications' : 'Enable Notifications'}
 *     </button>
 *   )}
 * </WebPushSubscription>
 * ```
 */
export function WebPushSubscription({
  onSubscriptionChange,
  onError,
  children,
}: WebPushSubscriptionProps): React.ReactNode {
  const hookResult = useWebPush()

  // Call callbacks on state changes
  useEffect(() => {
    onSubscriptionChange?.(hookResult.isSubscribed)
  }, [hookResult.isSubscribed, onSubscriptionChange])

  useEffect(() => {
    if (hookResult.error) {
      onError?.(hookResult.error)
    }
  }, [hookResult.error, onError])

  if (children) {
    return <>{children(hookResult)}</>
  }

  return null
}

export default WebPushSubscription
