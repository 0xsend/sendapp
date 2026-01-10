import * as Notifications from 'expo-notifications'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AppState, type AppStateStatus, Platform } from 'react-native'
import debug from 'debug'
import {
  navigateFromNotification,
  parseNotificationData,
} from 'app/navigation/notification-navigation'
import type { NotificationData } from 'app/types/notification-types'
import { AndroidNotificationChannels } from 'app/types/notification-types'

const log = debug('app:hooks:useNotificationHandler')

export interface UseNotificationHandlerOptions {
  /**
   * Whether to handle notification taps and navigate.
   * @default true
   */
  enableNavigation?: boolean
  /**
   * Callback when a notification is received in the foreground.
   */
  onNotificationReceived?: (notification: Notifications.Notification) => void
  /**
   * Callback when a notification is tapped.
   */
  onNotificationTapped?: (
    response: Notifications.NotificationResponse,
    data: NotificationData | null
  ) => void
}

export interface UseNotificationHandlerResult {
  /**
   * The last notification received while in foreground.
   */
  lastNotification: Notifications.Notification | null
  /**
   * The last notification response (tap).
   */
  lastResponse: Notifications.NotificationResponse | null
  /**
   * Clear the badge count.
   */
  clearBadge: () => Promise<void>
  /**
   * Get the current badge count.
   */
  getBadgeCount: () => Promise<number>
  /**
   * Set the badge count.
   */
  setBadgeCount: (count: number) => Promise<void>
  /**
   * Dismiss all notifications from the notification center.
   */
  dismissAllNotifications: () => Promise<void>
}

/**
 * Hook for handling push notification events (receive, tap, dismiss).
 *
 * This hook complements useNotifications by focusing on notification
 * event handling rather than token management.
 *
 * Usage:
 * ```tsx
 * function App() {
 *   useNotificationHandler({
 *     onNotificationReceived: (notification) => {
 *       console.log('Received:', notification)
 *     },
 *     onNotificationTapped: (response, data) => {
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
  const { enableNavigation = true, onNotificationReceived, onNotificationTapped } = options

  const [lastNotification, setLastNotification] = useState<Notifications.Notification | null>(null)
  const [lastResponse, setLastResponse] = useState<Notifications.NotificationResponse | null>(null)

  const notificationListener = useRef<Notifications.EventSubscription>()
  const responseListener = useRef<Notifications.EventSubscription>()
  const appStateRef = useRef<AppStateStatus>(AppState.currentState)

  // Avoid double-handling the same notification response (e.g. cold-start + response listener)
  const lastHandledResponseKeyRef = useRef<string | null>(null)
  // Allow canceling delayed navigation on unmount
  const navigationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /**
   * Handle notification received while app is foregrounded.
   */
  const handleNotificationReceived = useCallback(
    (notification: Notifications.Notification) => {
      log('Notification received in foreground:', notification.request.content)
      setLastNotification(notification)
      onNotificationReceived?.(notification)
    },
    [onNotificationReceived]
  )

  /**
   * Handle user interaction with notification (tap).
   */
  const handleNotificationResponse = useCallback(
    (response: Notifications.NotificationResponse) => {
      const responseKey = `${response.actionIdentifier}:${response.notification.request.identifier}`
      if (lastHandledResponseKeyRef.current === responseKey) {
        log('Skipping duplicate notification response:', responseKey)
        return
      }
      lastHandledResponseKeyRef.current = responseKey

      log('Notification response received:', response)
      setLastResponse(response)

      const rawData = response.notification.request.content.data
      const data = parseNotificationData(rawData)

      log('Parsed notification data:', data)
      onNotificationTapped?.(response, data)

      // Navigate if enabled and we have valid data
      if (enableNavigation && data) {
        // Small delay to ensure navigation is ready
        if (navigationTimeoutRef.current) {
          clearTimeout(navigationTimeoutRef.current)
        }

        navigationTimeoutRef.current = setTimeout(() => {
          navigateFromNotification(data)
        }, 100)
      }
    },
    [enableNavigation, onNotificationTapped]
  )

  /**
   * Clear the badge count.
   */
  const clearBadge = useCallback(async (): Promise<void> => {
    try {
      await Notifications.setBadgeCountAsync(0)
      log('Badge cleared')
    } catch (error) {
      log('Error clearing badge:', error)
    }
  }, [])

  /**
   * Get the current badge count.
   */
  const getBadgeCount = useCallback(async (): Promise<number> => {
    try {
      return await Notifications.getBadgeCountAsync()
    } catch (error) {
      log('Error getting badge count:', error)
      return 0
    }
  }, [])

  /**
   * Set the badge count.
   */
  const setBadgeCount = useCallback(async (count: number): Promise<void> => {
    try {
      await Notifications.setBadgeCountAsync(count)
      log('Badge set to:', count)
    } catch (error) {
      log('Error setting badge count:', error)
    }
  }, [])

  /**
   * Dismiss all notifications from the notification center.
   */
  const dismissAllNotifications = useCallback(async (): Promise<void> => {
    try {
      await Notifications.dismissAllNotificationsAsync()
      log('All notifications dismissed')
    } catch (error) {
      log('Error dismissing notifications:', error)
    }
  }, [])

  // Handle app coming from killed state (cold start) with notification
  useEffect(() => {
    let isActive = true

    const getInitialNotification = async () => {
      try {
        // Get notification that launched the app
        const response = await Notifications.getLastNotificationResponseAsync()
        if (!isActive || !response) {
          return
        }

        log('App launched from notification:', response)
        handleNotificationResponse(response)
      } catch (error) {
        log('Error getting initial notification response:', error)
      }
    }

    // Small delay to ensure app is ready
    const timer = setTimeout(() => {
      void getInitialNotification()
    }, 500)

    return () => {
      isActive = false
      clearTimeout(timer)
    }
  }, [handleNotificationResponse])

  // Set up notification listeners
  useEffect(() => {
    // Listener for notifications received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(
      handleNotificationReceived
    )

    // Listener for user interaction with notifications
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse
    )

    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current)
        navigationTimeoutRef.current = null
      }

      if (notificationListener.current) {
        notificationListener.current.remove()
        notificationListener.current = undefined
      }
      if (responseListener.current) {
        responseListener.current.remove()
        responseListener.current = undefined
      }
    }
  }, [handleNotificationReceived, handleNotificationResponse])

  // Clear badge when app becomes active
  useEffect(() => {
    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        // Optionally clear badge when app becomes active
        // void clearBadge()
        log('App became active')
      }
      appStateRef.current = nextState
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange)
    return () => subscription.remove()
  }, [])

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
 * Configure Android notification channels.
 *
 * Should be called early in app initialization on Android.
 * This configures multiple channels for different notification types.
 */
export async function configureAndroidNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') {
    return
  }

  log('Configuring Android notification channels...')

  // Default channel for general notifications
  await Notifications.setNotificationChannelAsync(AndroidNotificationChannels.DEFAULT, {
    name: 'Default',
    description: 'General notifications',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#86ad7f',
    enableVibrate: true,
    enableLights: true,
  })

  // Transfers channel for transfer notifications
  await Notifications.setNotificationChannelAsync(AndroidNotificationChannels.TRANSFERS, {
    name: 'Transfers',
    description: 'Notifications for money transfers',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#86ad7f',
    enableVibrate: true,
    enableLights: true,
    sound: 'default',
  })

  // SendEarn channel for earn-related notifications
  await Notifications.setNotificationChannelAsync(AndroidNotificationChannels.SEND_EARN, {
    name: 'Send Earn',
    description: 'Notifications for Send Earn activities',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250],
    lightColor: '#86ad7f',
    enableVibrate: true,
  })

  // System channel for system announcements
  await Notifications.setNotificationChannelAsync(AndroidNotificationChannels.SYSTEM, {
    name: 'System',
    description: 'Important system notifications',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 500],
    lightColor: '#ff0000',
    enableVibrate: true,
    enableLights: true,
  })

  log('Android notification channels configured')
}

/**
 * Configure iOS notification categories with actions.
 *
 * Should be called early in app initialization on iOS.
 */
export async function configureIOSNotificationCategories(): Promise<void> {
  if (Platform.OS !== 'ios') {
    return
  }

  log('Configuring iOS notification categories...')

  await Notifications.setNotificationCategoryAsync('transfer', [
    {
      identifier: 'view',
      buttonTitle: 'View',
      options: {
        opensAppToForeground: true,
      },
    },
    {
      identifier: 'dismiss',
      buttonTitle: 'Dismiss',
      options: {
        isDestructive: true,
      },
    },
  ])

  await Notifications.setNotificationCategoryAsync('send_earn', [
    {
      identifier: 'view',
      buttonTitle: 'View Details',
      options: {
        opensAppToForeground: true,
      },
    },
  ])

  await Notifications.setNotificationCategoryAsync('system', [
    {
      identifier: 'view',
      buttonTitle: 'Learn More',
      options: {
        opensAppToForeground: true,
      },
    },
  ])

  log('iOS notification categories configured')
}

/**
 * Initialize all notification configurations.
 *
 * Call this once during app startup to set up:
 * - Android notification channels
 * - iOS notification categories
 */
export async function initializeNotificationConfig(): Promise<void> {
  await Promise.all([configureAndroidNotificationChannels(), configureIOSNotificationCategories()])
}
