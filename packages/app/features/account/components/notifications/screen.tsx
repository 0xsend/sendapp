import { Card, Paragraph, Separator, XStack, YStack, Switch, Theme } from '@my/ui'
import { SettingsHeader } from 'app/features/account/components/SettingsHeader'
import { useCallback, useState, useEffect } from 'react'
import { BellOff, Check, AlertCircle, Monitor } from '@tamagui/lucide-icons'
import { useSessionContext } from 'app/utils/supabase/useSessionContext'

type PermissionState = 'prompt' | 'granted' | 'denied' | 'unsupported' | 'loading'

/**
 * Check if Web Push is supported
 */
function checkWebPushSupport(): boolean {
  if (typeof window === 'undefined') return false
  if (!('serviceWorker' in navigator)) return false
  if (!('PushManager' in window)) return false
  if (!('Notification' in window)) return false
  return true
}

/**
 * Hook for managing notification permissions and subscription state (web only).
 *
 * This hook routes all subscription operations through /api/notifications/subscribe
 * to ensure proper validation, rate limiting, and CSRF protection.
 */
function useNotificationSettings() {
  const { session } = useSessionContext()
  const [permission, setPermission] = useState<PermissionState>('loading')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isSupported = checkWebPushSupport()

  // Check initial permission state
  useEffect(() => {
    if (!isSupported) {
      setPermission('unsupported')
      return
    }

    const checkPermission = async () => {
      const notificationPermission = Notification.permission
      const normalizedPermission =
        notificationPermission === 'default' ? 'prompt' : notificationPermission
      setPermission(normalizedPermission as PermissionState)

      // Check for existing subscription
      try {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()
        setIsSubscribed(!!subscription)
      } catch (err) {
        console.error('[Notifications] Error checking subscription:', err)
      }
    }

    void checkPermission()
  }, [isSupported])

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported || !session?.user) {
      setError('Push notifications not available')
      return false
    }

    setIsLoading(true)
    setError(null)

    try {
      // Request permission if needed
      if (Notification.permission !== 'granted') {
        const result = await Notification.requestPermission()
        setPermission(result === 'default' ? 'prompt' : (result as PermissionState))
        if (result !== 'granted') {
          setError('Permission denied')
          return false
        }
      }

      // Get VAPID public key from environment
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) {
        setError('Push notifications not configured')
        return false
      }

      // Convert VAPID key to Uint8Array
      const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
        const rawData = window.atob(base64)
        const outputArray = new Uint8Array(rawData.length)
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i)
        }
        return outputArray
      }

      // Subscribe to push
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey) as BufferSource,
      })

      // Send to backend via API route (includes validation/rate-limiting)
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ subscription: subscription.toJSON() }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save subscription')
      }

      setIsSubscribed(true)
      setPermission('granted')
      return true
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to enable notifications'
      setError(errMsg)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [isSupported, session?.user])

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false

    setIsLoading(true)
    setError(null)

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (subscription) {
        await subscription.unsubscribe()

        // Remove from backend via API route
        await fetch('/api/notifications/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        })
      }

      setIsSubscribed(false)
      return true
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to disable notifications'
      setError(errMsg)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [isSupported])

  return {
    permission,
    isSubscribed,
    isLoading,
    error,
    isSupported,
    subscribe,
    unsubscribe,
  }
}

interface NotificationOptionProps {
  title: string
  description: string
  icon: React.ReactNode
  isEnabled: boolean
  isLoading: boolean
  isDisabled: boolean
  onToggle: () => void
}

const NotificationOption = ({
  title,
  description,
  icon,
  isEnabled,
  isLoading,
  isDisabled,
  onToggle,
}: NotificationOptionProps) => {
  return (
    <XStack ai="center" jc="space-between" px={'$2'} py={'$3'} br={'$4'}>
      <XStack ai="center" gap={'$3'} flex={1}>
        {icon}
        <YStack flex={1}>
          <Paragraph size={'$5'}>{title}</Paragraph>
          <Paragraph size={'$2'} color={'$gray10'}>
            {description}
          </Paragraph>
        </YStack>
      </XStack>
      <Theme name={isEnabled ? 'green' : 'gray'}>
        <Switch
          size="$3"
          checked={isEnabled}
          onCheckedChange={onToggle}
          disabled={isDisabled || isLoading}
          opacity={isLoading ? 0.5 : 1}
          bg={isEnabled ? '$primary' : '$gray6'}
          borderColor={isEnabled ? '$primary' : '$gray6'}
        >
          <Switch.Thumb animation="quick" bg="$background" />
        </Switch>
      </Theme>
    </XStack>
  )
}

export const NotificationPreferences = () => {
  const { permission, isSubscribed, isLoading, error, isSupported, subscribe, unsubscribe } =
    useNotificationSettings()

  const handleToggle = useCallback(() => {
    if (isSubscribed) {
      void unsubscribe()
    } else {
      void subscribe()
    }
  }, [isSubscribed, subscribe, unsubscribe])

  // Web browser doesn't support notifications
  if (!isSupported || permission === 'unsupported') {
    return (
      <YStack gap={'$3.5'} w={'100%'}>
        <SettingsHeader>Notifications</SettingsHeader>
        <Card gap={'$3'} padded size={'$4'}>
          <XStack ai="center" gap={'$3'}>
            <AlertCircle size={24} color={'$gray10'} />
            <YStack flex={1}>
              <Paragraph size={'$4'} color={'$color12'}>
                Not Supported
              </Paragraph>
              <Paragraph size={'$3'} color={'$gray10'}>
                Push notifications are not supported in this browser. Try using Chrome, Firefox, or
                Safari.
              </Paragraph>
            </YStack>
          </XStack>
        </Card>
      </YStack>
    )
  }

  // Permission denied
  if (permission === 'denied') {
    return (
      <YStack gap={'$3.5'} w={'100%'}>
        <SettingsHeader>Notifications</SettingsHeader>
        <Card gap={'$3'} padded size={'$4'}>
          <XStack ai="center" gap={'$3'}>
            <BellOff size={24} color={'$red10'} />
            <YStack flex={1}>
              <Paragraph size={'$4'} color={'$color12'}>
                Notifications Blocked
              </Paragraph>
              <Paragraph size={'$3'} color={'$gray10'}>
                You&apos;ve blocked notifications for this site. To enable them, update your browser
                settings.
              </Paragraph>
            </YStack>
          </XStack>
        </Card>
      </YStack>
    )
  }

  return (
    <YStack gap={'$3.5'} w={'100%'}>
      <SettingsHeader>Notifications</SettingsHeader>
      <Card gap={'$3'} padded size={'$4'}>
        <Paragraph size={'$4'} color={'$color12'}>
          Get notified when you receive payments and other important activity.
        </Paragraph>
        {error && (
          <Paragraph size={'$2'} color={'$red10'}>
            {error}
          </Paragraph>
        )}
        <Separator boc={'$darkGrayTextField'} opacity={0.2} />
        <YStack>
          <NotificationOption
            title="Browser Notifications"
            description={
              isSubscribed
                ? 'You will receive notifications in this browser'
                : 'Receive notifications when the browser is open'
            }
            icon={<Monitor size={20} color={'$primary'} $theme-light={{ color: '$color12' }} />}
            isEnabled={isSubscribed}
            isLoading={isLoading}
            isDisabled={permission === 'loading'}
            onToggle={handleToggle}
          />
        </YStack>
        {isSubscribed && (
          <>
            <Separator boc={'$darkGrayTextField'} opacity={0.2} />
            <YStack gap={'$2'} pt={'$2'}>
              <Paragraph size={'$3'} color={'$gray10'}>
                You&apos;ll be notified about:
              </Paragraph>
              <XStack ai="center" gap={'$2'}>
                <Check size={14} color={'$green10'} />
                <Paragraph size={'$3'}>Received payments</Paragraph>
              </XStack>
              <XStack ai="center" gap={'$2'}>
                <Check size={14} color={'$green10'} />
                <Paragraph size={'$3'}>Account activity</Paragraph>
              </XStack>
            </YStack>
          </>
        )}
      </Card>
    </YStack>
  )
}
