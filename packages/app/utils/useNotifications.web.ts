import { useCallback, useEffect, useState } from 'react'
import { useSupabase } from './supabase/useSupabase'
import { useSessionContext } from './supabase/useSessionContext'
import debug from 'debug'

const log = debug('app:utils:useNotifications')

export interface UseNotificationsResult {
  /** Web push subscription endpoint */
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
 * - Token registration with backend (Supabase push_tokens table)
 * - Notification handling
 */
export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsResult {
  const { autoRegister = true, enableEventListeners = true } = options
  const supabase = useSupabase()
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
  const getWebPushSubscription = useCallback(async (): Promise<string | null> => {
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
        // You'll need to provide your VAPID public key here
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY

        if (!vapidPublicKey) {
          log('Missing VAPID public key')
          setError(new Error('Missing VAPID configuration'))
          return null
        }

        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        })
      }

      // Convert subscription to string for storage
      const subscriptionJson = JSON.stringify(subscription)
      log('Got web push subscription')
      return subscriptionJson
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to get push subscription')
      log('Error getting push subscription:', err)
      setError(err)
      return null
    }
  }, [])

  /**
   * Register push token with backend via Supabase RPC
   */
  const registerToken = useCallback(async (): Promise<boolean> => {
    if (!session?.user?.id) {
      log('Cannot register token: No authenticated user')
      return false
    }

    if (!expoPushToken) {
      // Try to get subscription first
      const token = await getWebPushSubscription()
      if (!token) {
        log('Cannot register token: Failed to get push subscription')
        return false
      }
      setExpoPushToken(token)
    }

    const tokenToRegister = expoPushToken || (await getWebPushSubscription())
    if (!tokenToRegister) {
      return false
    }

    try {
      log('Registering push token with backend...')

      // Use Supabase RPC to register token via the register_push_token function
      // Web push tokens must be registered with platform='web'
      const { data, error: rpcError } = await supabase.rpc('register_push_token', {
        token_value: tokenToRegister,
        token_platform: 'web' as 'expo' | 'web',
        token_device_id: getBrowserInfo(),
      })

      if (rpcError) {
        log('Error registering push token:', rpcError)
        setError(new Error(rpcError.message))
        return false
      }

      log('Successfully registered push token:', data?.[0]?.id)
      return true
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to register push token')
      log('Error registering push token:', err)
      setError(err)
      return false
    }
  }, [session?.user?.id, expoPushToken, getWebPushSubscription, supabase])

  /**
   * Unregister push token from backend
   */
  const unregisterToken = useCallback(async (): Promise<boolean> => {
    if (!session?.user?.id || !expoPushToken) {
      return false
    }

    try {
      log('Unregistering push token...')

      const { error: deleteError } = await supabase
        .from('push_tokens')
        .delete()
        .eq('token', expoPushToken)
        .eq('user_id', session.user.id)
        .eq('platform', 'web')

      if (deleteError) {
        log('Error unregistering push token:', deleteError)
        setError(new Error(deleteError.message))
        return false
      }

      // Also unsubscribe from push service
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()
        if (subscription) {
          await subscription.unsubscribe()
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
  }, [session?.user?.id, expoPushToken, supabase])

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
        setExpoPushToken(subscription)
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

  // Set up notification listeners (optional) - handled by Service Worker on web
  useEffect(() => {
    if (!enableEventListeners || typeof window === 'undefined') {
      return
    }

    // On web, notifications are typically handled by the Service Worker
    // You can listen for messages from the Service Worker here
    const messageHandler = (event: MessageEvent) => {
      if (event.data?.type === 'notification-click') {
        log('Notification clicked:', event.data.notification)
        // Handle notification click - navigation handled in notification-navigation.web.ts
      }
    }

    navigator.serviceWorker?.addEventListener('message', messageHandler)

    return () => {
      navigator.serviceWorker?.removeEventListener('message', messageHandler)
    }
  }, [enableEventListeners])

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

/**
 * Get browser info for device identification
 */
function getBrowserInfo(): string {
  if (typeof window === 'undefined') return 'unknown'

  const ua = navigator.userAgent
  let browser = 'Unknown'

  if (ua.includes('Firefox')) browser = 'Firefox'
  else if (ua.includes('Chrome')) browser = 'Chrome'
  else if (ua.includes('Safari')) browser = 'Safari'
  else if (ua.includes('Edge')) browser = 'Edge'

  return `${browser} on ${navigator.platform}`
}
