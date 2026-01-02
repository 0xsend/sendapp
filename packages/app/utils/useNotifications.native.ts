import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Platform, AppState, type AppStateStatus } from 'react-native'
import { useSupabase } from './supabase/useSupabase'
import { useSessionContext } from './supabase/useSessionContext'
import { router } from 'expo-router'
import debug from 'debug'

const log = debug('app:utils:useNotifications')

export interface UseNotificationsResult {
  /** Expo push token for this device */
  expoPushToken: string | null
  /** Whether push notifications are enabled */
  isEnabled: boolean
  /** Current permission status */
  permissionStatus: Notifications.PermissionStatus | null
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
}

/**
 * Hook for managing Expo push notifications on native platforms.
 *
 * Handles:
 * - Permission requests
 * - Push token retrieval from Expo Push Service
 * - Token registration with backend (Supabase push_tokens table)
 * - Foreground/background notification handling
 */
export function useNotifications(options: UseNotificationsOptions = {}): UseNotificationsResult {
  const { autoRegister = true } = options
  const supabase = useSupabase()
  const { session } = useSessionContext()

  const [expoPushToken, setExpoPushToken] = useState<string | null>(null)
  const [permissionStatus, setPermissionStatus] = useState<Notifications.PermissionStatus | null>(
    null
  )
  const [isRequestingPermission, setIsRequestingPermission] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const notificationListener = useRef<Notifications.EventSubscription>()
  const responseListener = useRef<Notifications.EventSubscription>()

  const isEnabled = permissionStatus === Notifications.PermissionStatus.GRANTED

  /**
   * Request notification permissions from the user
   */
  const requestPermissions = useCallback(async (): Promise<boolean> => {
    if (!Device.isDevice) {
      log('Push notifications require a physical device')
      setError(new Error('Push notifications require a physical device'))
      return false
    }

    setIsRequestingPermission(true)
    setError(null)

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync()

      if (existingStatus === Notifications.PermissionStatus.GRANTED) {
        setPermissionStatus(existingStatus)
        setIsRequestingPermission(false)
        return true
      }

      const { status } = await Notifications.requestPermissionsAsync()
      setPermissionStatus(status)
      setIsRequestingPermission(false)

      return status === Notifications.PermissionStatus.GRANTED
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to request permissions')
      log('Error requesting permissions:', err)
      setError(err)
      setIsRequestingPermission(false)
      return false
    }
  }, [])

  /**
   * Get Expo push token from Expo Push Service
   */
  const getExpoPushToken = useCallback(async (): Promise<string | null> => {
    if (!Device.isDevice) {
      log('Push notifications require a physical device')
      return null
    }

    try {
      // Prefer the modern EAS config, fall back to legacy expoConfig.extra.eas.
      const projectId =
        Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId

      if (!projectId) {
        log('Missing EAS project ID in app config')
        setError(new Error('Missing EAS project ID'))
        return null
      }

      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId,
      })

      log('Got Expo push token:', `${tokenData.data.substring(0, 30)}...`)
      return tokenData.data
    } catch (e) {
      const err = e instanceof Error ? e : new Error('Failed to get push token')
      log('Error getting push token:', err)
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

    if (!isEnabled) {
      log('Cannot register token: Notifications permission not granted')
      return false
    }

    const token = expoPushToken ?? (await getExpoPushToken())
    if (!token) {
      log('Cannot register token: Failed to get push token')
      return false
    }

    // Keep local state in sync, but avoid extra token fetches.
    if (!expoPushToken) {
      setExpoPushToken(token)
    }

    try {
      log('Registering push token with backend...')

      // Use Supabase RPC to register token via the register_push_token function
      // Backend schema uses push_token_platform = ('expo' | 'web')
      const { data, error: rpcError } = await supabase.rpc('register_push_token', {
        token_value: token,
        token_platform: 'expo',
        token_device_id: Device.deviceName || undefined,
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
  }, [session?.user?.id, isEnabled, expoPushToken, getExpoPushToken, supabase])

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
        .eq('platform', 'expo')
        .eq('user_id', session.user.id)

      if (deleteError) {
        log('Error unregistering push token:', deleteError)
        setError(new Error(deleteError.message))
        return false
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

  /**
   * Handle notification received while app is foregrounded
   */
  const handleNotification = useCallback((notification: Notifications.Notification) => {
    log('Received notification in foreground:', notification.request.content)
    // The notification will be shown by Expo based on handler config
  }, [])

  /**
   * Handle user interaction with notification (tap)
   */
  const handleNotificationResponse = useCallback((response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data
    log('User tapped notification:', data)

    // Navigate based on notification data
    if (data?.type === 'transfer_received' || data?.type === 'transfer_sent') {
      // Navigate to activity screen
      router.push('/activity')
    } else if (data?.route) {
      // Generic route navigation
      router.push(data.route as string)
    }
  }, [])

  // Check permissions on mount
  useEffect(() => {
    const checkPermissions = async () => {
      if (!Device.isDevice) return

      const { status } = await Notifications.getPermissionsAsync()
      setPermissionStatus(status)
    }

    void checkPermissions()
  }, [])

  // Get push token when permissions are granted
  useEffect(() => {
    if (!isEnabled || !Device.isDevice) return

    const fetchToken = async () => {
      const token = await getExpoPushToken()
      if (token) {
        setExpoPushToken(token)
      }
    }

    void fetchToken()
  }, [isEnabled, getExpoPushToken])

  // Auto-register token when user is authenticated and we have a token
  useEffect(() => {
    if (!autoRegister || !session?.user?.id || !expoPushToken || !isEnabled) {
      return
    }

    void registerToken()
  }, [autoRegister, session?.user?.id, expoPushToken, isEnabled, registerToken])

  // Set up notification listeners
  useEffect(() => {
    // Listener for notifications received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(handleNotification)

    // Listener for user interaction with notifications
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse
    )

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove()
      }
      if (responseListener.current) {
        responseListener.current.remove()
      }
    }
  }, [handleNotification, handleNotificationResponse])

  // Re-check permissions when app comes to foreground
  useEffect(() => {
    const handleAppStateChange = async (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        const { status } = await Notifications.getPermissionsAsync()
        setPermissionStatus(status)
      }
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange)
    return () => subscription.remove()
  }, [])

  // Configure Android notification channel
  useEffect(() => {
    if (Platform.OS === 'android') {
      void Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#86ad7f',
      })
    }
  }, [])

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
 * Configure how notifications are handled when app is in foreground.
 * Call this early in app initialization (e.g., _layout.tsx).
 */
export function configureNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  })
}
