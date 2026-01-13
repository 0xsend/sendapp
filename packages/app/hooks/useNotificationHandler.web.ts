import { useCallback, useEffect, useState } from 'react'
import debug from 'debug'
import {
  navigateFromNotification,
  parseNotificationData,
} from 'app/navigation/notification-navigation'
import type { NotificationData } from 'app/types/notification-types'

const log = debug('app:hooks:useNotificationHandler')

export interface UseNotificationHandlerOptions {
  /**
   * Whether to handle notification taps and navigate.
   * @default true
   */
  enableNavigation?: boolean
  /**
   * Callback when a notification is received.
   */
  onNotificationReceived?: (notification: Notification) => void
  /**
   * Callback when a notification is tapped.
   */
  onNotificationTapped?: (notification: Notification, data: NotificationData | null) => void
}

export interface UseNotificationHandlerResult {
  /**
   * The last notification received.
   */
  lastNotification: Notification | null
  /**
   * The last notification that was clicked.
   */
  lastResponse: Notification | null
  /**
   * Clear the badge count (no-op on web).
   */
  clearBadge: () => Promise<void>
  /**
   * Get the current badge count (no-op on web).
   */
  getBadgeCount: () => Promise<number>
  /**
   * Set the badge count (no-op on web).
   */
  setBadgeCount: (count: number) => Promise<void>
  /**
   * Dismiss all notifications.
   */
  dismissAllNotifications: () => Promise<void>
}

/**
 * Hook for handling web push notification events (receive, click).
 *
 * This hook complements useNotifications by focusing on notification
 * event handling rather than token management.
 *
 * On web, most notification handling happens in the Service Worker,
 * so this hook primarily listens for messages from the Service Worker.
 *
 * Usage:
 * ```tsx
 * function App() {
 *   useNotificationHandler({
 *     onNotificationReceived: (notification) => {
 *       console.log('Received:', notification)
 *     },
 *     onNotificationTapped: (notification, data) => {
 *       console.log('Tapped:', data)
 *     },
 *   })
 *   return <YourApp />
 * }
 * ```
 */
export function useNotificationHandler(
  options: UseNotificationHandlerOptions = {}
): UseNotificationHandlerResult {
  // Note: onNotificationReceived and onNotificationTapped are kept for API compatibility
  // but are not currently used because the service worker handles notification display
  // and click navigation directly (no events are sent to the client).
  const { enableNavigation = true } = options

  // These states are part of the hook's public API for compatibility with native,
  // but are not populated on web because the service worker handles notification
  // events directly without posting messages to the client.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [lastNotification, setLastNotification] = useState<Notification | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [lastResponse, setLastResponse] = useState<Notification | null>(null)

  /**
   * Clear the badge count (no-op on web).
   */
  const clearBadge = useCallback(async (): Promise<void> => {
    // Badge API is limited on web
    log('clearBadge called (no-op on web)')
  }, [])

  /**
   * Get the current badge count (no-op on web).
   */
  const getBadgeCount = useCallback(async (): Promise<number> => {
    log('getBadgeCount called (no-op on web)')
    return 0
  }, [])

  /**
   * Set the badge count (no-op on web).
   */
  const setBadgeCount = useCallback(async (count: number): Promise<void> => {
    log('setBadgeCount called (no-op on web):', count)
    // The Badge API is experimental and not widely supported
    // if ('setAppBadge' in navigator) {
    //   await (navigator as any).setAppBadge(count)
    // }
  }, [])

  /**
   * Dismiss all notifications.
   */
  const dismissAllNotifications = useCallback(async (): Promise<void> => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    try {
      const registration = await navigator.serviceWorker.ready
      const notifications = await registration.getNotifications()
      for (const notification of notifications) {
        notification.close()
      }
      log('All notifications dismissed')
    } catch (error) {
      log('Error dismissing notifications:', error)
    }
  }, [])

  // Listen for messages from Service Worker
  // Note: The service worker handles notification display and click navigation directly.
  // We only receive PUSH_SUBSCRIPTION_CHANGED messages for re-syncing subscriptions.
  // Notification clicks are handled entirely by the service worker which navigates
  // to the appropriate URL - the client doesn't receive click events.
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    const messageHandler = (event: MessageEvent) => {
      const { type } = event.data || {}

      // Currently the service worker only posts PUSH_SUBSCRIPTION_CHANGED
      // which is handled by useNotifications.web.ts for re-syncing tokens.
      // Notification clicks are handled by the service worker directly via navigation.
      if (type === 'PUSH_SUBSCRIPTION_CHANGED') {
        log('Push subscription changed (handled by useNotifications)')
      }
    }

    navigator.serviceWorker.addEventListener('message', messageHandler)

    return () => {
      navigator.serviceWorker.removeEventListener('message', messageHandler)
    }
  }, [])

  // Check for notifications on mount (in case app was opened from notification)
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    const checkInitialNotification = async () => {
      try {
        // Check if there's a notification action in the URL params
        const params = new URLSearchParams(window.location.search)
        const notificationData = params.get('notification')

        if (notificationData) {
          try {
            const data = JSON.parse(decodeURIComponent(notificationData))
            const parsedData = parseNotificationData(data)

            if (parsedData && enableNavigation) {
              log('Handling initial notification from URL:', parsedData)
              setTimeout(() => {
                navigateFromNotification(parsedData)
              }, 100)
            }

            // Clean up URL
            params.delete('notification')
            const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`
            window.history.replaceState({}, '', newUrl)
          } catch (e) {
            log('Error parsing notification data from URL:', e)
          }
        }
      } catch (error) {
        log('Error checking initial notification:', error)
      }
    }

    void checkInitialNotification()
  }, [enableNavigation])

  return {
    lastNotification,
    lastResponse,
    clearBadge,
    getBadgeCount,
    setBadgeCount,
    dismissAllNotifications,
  }
}

/**
 * Configure web notification channels.
 * On web, channels aren't as structured as Android, so this is mostly a no-op.
 */
export async function configureAndroidNotificationChannels(): Promise<void> {
  log('configureAndroidNotificationChannels called (no-op on web)')
}

/**
 * Configure iOS notification categories.
 * On web, this is a no-op.
 */
export async function configureIOSNotificationCategories(): Promise<void> {
  log('configureIOSNotificationCategories called (no-op on web)')
}

/**
 * Initialize all notification configurations.
 * On web, this is handled by the Service Worker.
 */
export async function initializeNotificationConfig(): Promise<void> {
  log('Notification configuration handled by Service Worker on web')
}
