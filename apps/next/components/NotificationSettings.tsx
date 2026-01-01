'use client'

import { useWebPush } from './WebPushSubscription'
import { Button, YStack, XStack, Text, Paragraph } from '@my/ui'
import { Bell, BellOff, AlertCircle } from '@tamagui/lucide-icons'

export function NotificationSettings() {
  const { permission, isSubscribed, isLoading, error, isSupported, subscribe, unsubscribe } =
    useWebPush()

  if (!isSupported) {
    return (
      <YStack gap="$2" padding="$4" borderRadius="$4" backgroundColor="$gray3">
        <XStack gap="$2" alignItems="center">
          <AlertCircle size={20} color="$gray11" />
          <Text color="$gray11">Push notifications not supported in this browser</Text>
        </XStack>
      </YStack>
    )
  }

  if (permission === 'denied') {
    return (
      <YStack gap="$2" padding="$4" borderRadius="$4" backgroundColor="$red3">
        <XStack gap="$2" alignItems="center">
          <BellOff size={20} color="$red11" />
          <Text color="$red11">Notifications blocked</Text>
        </XStack>
        <Paragraph size="$2" color="$red11">
          You&apos;ve blocked notifications. Enable them in your browser settings.
        </Paragraph>
      </YStack>
    )
  }

  return (
    <YStack gap="$3" padding="$4">
      <XStack gap="$2" alignItems="center">
        <Bell size={24} />
        <Text fontSize="$5" fontWeight="600">
          Push Notifications
        </Text>
      </XStack>

      {error && (
        <YStack padding="$3" backgroundColor="$red3" borderRadius="$3">
          <Text color="$red11" fontSize="$2">
            {error}
          </Text>
        </YStack>
      )}

      <Paragraph size="$3" color="$gray11">
        {isSubscribed
          ? 'Get notified when you receive payments'
          : 'Enable notifications to get real-time payment alerts'}
      </Paragraph>

      <Button
        onPress={isSubscribed ? unsubscribe : subscribe}
        disabled={isLoading}
        theme={isSubscribed ? 'red' : 'green'}
        icon={isSubscribed ? BellOff : Bell}
      >
        {isLoading ? 'Loading...' : isSubscribed ? 'Disable Notifications' : 'Enable Notifications'}
      </Button>

      {isSubscribed && (
        <Text size="$2" color="$green11">
          ✓ You&apos;ll be notified of new payments
        </Text>
      )}
    </YStack>
  )
}
