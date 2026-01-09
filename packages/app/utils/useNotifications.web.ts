import { useCallback, useEffect, useState } from 'react'
import { useSessionContext } from './supabase/useSessionContext'
import debug from 'debug'

const log = debug('app:utils:useNotifications')

export interface UseNotificationsResult {
  /** Web push subscription (JSON stringified) */
  expoPushToken: string | null
  /** Whether push notifications are enabled */
  isEnabled: boolean
  /** Current permission status */
  permissionStatus: NotificationPermission | null
  /** Whether we're currently requesting permissions */
  isRequestingPermission: boolean
  /** Any error that occurred */
  error: Error | null
  /** Request notification permissions */
  requestPermissions: () => Promise<boolean>
  /** Register push token with backend */
  registerToken: () => Promise<boolean>
  /** Unregister push token from backend */
  unregisterToken: () => Promise<boolean>
}

interface UseNotificationsOptions {
  /** Auto-register token when user is authenticated and permissions granted */
  autoRegister?: boolean
  /** Whether this hook should attach notification received/tap listeners (navigation, etc). */
  enableEventListeners?: boolean
}

/**
 * Hook for managing Web Push notifications on web platforms.
 *
 * Handles:
 * - Permission requests
 * - Push subscription via Service Worker
 * - Token registration with backend via /api/notifications/subscribe
 * - Notification handling
 *
 * All subscription operations route through /api/notifications/subscribe
 * to ensure proper validation, rate limiting, and CSRF protection.
 */
export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsResult {
  const { autoRegister = true, enableEventListeners = true } = options
  const { session } = useSessionContext()

  const [expoPushToken, setExpoPushToken] = useState<string | null>(null)
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission | null>(null)
  const [isRequestingPermission, setIsRequestingPermission] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const isEnabled = permissionStatus === 'granted'

  /**
   * Request notification permissions from the user
   */
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      log('Web Push notifications not supported in this browser')
      setError(new Error('Web Push notifications not supported'))
      return false
    }

    setIsRequestingPermission(true)
    setError(null)

    try {
      const permission = await Notification.requestPermission()
      setPermissionStatus(permission)
      setIsRequestingPermission(false)

      return permission === 'granted'
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to request permissions')
      log('Error requesting permissions:', err)
      setError(err)
      setIsRequestingPermission(false)
      return false
    }
  }, [])

  /**
   * Get Web Push subscription from Service Worker
   */
  const getWebPushSubscription = useCallback(async (): Promise<PushSubscription | null> => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      log('Service Workers not supported')
      return null
    }

    try {
      // Get service worker registration
      const registration = await navigator.serviceWorker.ready

      // Get existing subscription or create new one
      let subscription = await registration.pushManager.getSubscription()

      if (!subscription) {
        // Create new subscription
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

        if (!vapidPublicKey) {
          log('Missing VAPID public key')
          setError(new Error('Missing VAPID configuration'))
          return null
        }

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
        })
      }

      log('Got web push subscription')
      return subscription
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to get push subscription')
      log('Error getting push subscription:', err)
      setError(err)
      return null
    }
  }, [])

  /**
   * Register push token with backend via /api/notifications/subscribe
   */
  const registerToken = useCallback(async (): Promise<boolean> => {
    if (!session?.user?.id) {
      log('Cannot register token: No authenticated user')
      return false
    }

    try {
      log('Registering push token with backend...')

      // Get push subscription
      const subscription = await getWebPushSubscription()
      if (!subscription) {
        log('Cannot register token: Failed to get push subscription')
        return false
      }

      // Store stringified subscription for state
      const subscriptionJson = JSON.stringify(subscription)
      setExpoPushToken(subscriptionJson)

      // Register via API route (includes validation, rate limiting, CSRF protection)
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        cache: 'no-store',
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        const errorMsg = data.error || `HTTP ${response.status}`
        log('Error registering push token:', errorMsg)
        setError(new Error(errorMsg))
        return false
      }

      log('Successfully registered push token')
      return true
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to register push token')
      log('Error registering push token:', err)
      setError(err)
      return false
    }
  }, [session?.user?.id, getWebPushSubscription])

  /**
   * Unregister push token from backend via /api/notifications/subscribe
   */
  const unregisterToken = useCallback(async (): Promise<boolean> => {
    if (!session?.user?.id) {
      return false
    }

    try {
      log('Unregistering push token...')

      // Get current subscription to get the endpoint
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        // Unsubscribe from push service first
        await subscription.unsubscribe()

        // Remove from backend via API route
        const response = await fetch('/api/notifications/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          cache: 'no-store',
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        })

        if (!response.ok) {
          log('Warning: Failed to remove subscription from backend')
          // Don't throw - local unsubscribe succeeded
        }
      }

      setExpoPushToken(null)
      log('Successfully unregistered push token')
      return true
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to unregister push token')
      log('Error unregistering push token:', err)
      setError(err)
      return false
    }
  }, [session?.user?.id])

  // Check permissions on mount
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return

    setPermissionStatus(Notification.permission)
  }, [])

  // Get push subscription when permissions are granted
  useEffect(() => {
    if (!isEnabled || typeof window === 'undefined') return

    const fetchSubscription = async () => {
      const subscription = await getWebPushSubscription()
      if (subscription) {
        setExpoPushToken(JSON.stringify(subscription))
      }
    }

    void fetchSubscription()
  }, [isEnabled, getWebPushSubscription])

  // Auto-register token when user is authenticated and we have a token
  useEffect(() => {
    if (!autoRegister || !session?.user?.id || !expoPushToken || !isEnabled) {
      return
    }

    void registerToken()
  }, [autoRegister, session?.user?.id, expoPushToken, isEnabled, registerToken])

  // Set up notification listeners - listen for PUSH_SUBSCRIPTION_CHANGED from service worker
  useEffect(() => {
    if (!enableEventListeners || typeof window === 'undefined') {
      return
    }

    // On web, notifications are handled by the Service Worker
    // We listen for subscription changes to re-sync with backend
    const messageHandler = (event: MessageEvent) => {
      if (event.data?.type === 'PUSH_SUBSCRIPTION_CHANGED') {
        log('Push subscription changed, re-syncing with backend...')
        void registerToken()
      }
    }

    navigator.serviceWorker?.addEventListener('message', messageHandler)

    return () => {
      navigator.serviceWorker?.removeEventListener('message', messageHandler)
    }
  }, [enableEventListeners, registerToken])

  return {
    expoPushToken,
    isEnabled,
    permissionStatus,
    isRequestingPermission,
    error,
    requestPermissions,
    registerToken,
    unregisterToken,
  }
}

/**
 * Configure how notifications are handled.
 * On web, this is handled by the Service Worker, so this is a no-op.
 */
export function configureNotificationHandler(): void {
  // No-op on web - Service Worker handles notification display
  log('Notification handler configuration handled by Service Worker')
}

/**
 * Helper to convert VAPID key to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
