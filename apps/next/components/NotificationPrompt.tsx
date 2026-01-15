'use client'

import { useWebPush } from './WebPushSubscription'
import { Button, YStack, XStack, Text, Paragraph } from '@my/ui'
import { Bell } from '@tamagui/lucide-icons'
import { useEffect, useState } from 'react'

export interface NotificationPromptProps {
  /** Called when the prompt is dismissed */
  onDismiss?: () => void
  /** Title text */
  title?: string
  /** Description text */
  description?: string
}

/**
 * Contextual notification permission prompt.
 * Shows only when:
 * - Permission hasn't been requested yet
 * - Browser supports notifications
 * - User is authenticated
 */
export function NotificationPrompt({
  onDismiss,
  title = 'Get notified of payments',
  description = 'Enable notifications to know instantly when someone sends you money',
}: NotificationPromptProps) {
  const { permission, isSupported, subscribe, isLoading } = useWebPush()
  const [dismissed, setDismissed] = useState(false)

  const handleDismiss = () => {
    setDismissed(true)
    onDismiss?.()
  }

  const handleEnable = async () => {
    const success = await subscribe()
    if (success) {
      handleDismiss()
    }
  }

  // Don't show if:
  // - Not supported
  // - Permission already requested
  // - User dismissed
  useEffect(() => {
    if (!isSupported || permission !== 'prompt' || dismissed) {
      onDismiss?.()
    }
  }, [isSupported, permission, dismissed, onDismiss])

  return (
    <YStack
      componentName="Card"
      padding="$4"
      backgroundColor="$background"
      borderRadius="$6"
      borderWidth={1}
      borderColor="$borderColor"
      gap="$5"
      elevation="$8"
      shadowOpacity={0.3}
    >
      <XStack justifyContent="space-between" alignItems="flex-start">
        <XStack gap="$3" flex={1} alignItems="flex-start">
          <Bell size={24} color="$green10" />
          <YStack flex={1} gap="$2">
            <Text fontSize="$4" fontWeight="600">
              {title}
            </Text>
            <Paragraph size="$3" color="$gray11">
              {description}
            </Paragraph>
          </YStack>
        </XStack>
      </XStack>

      <XStack gap="$2">
        <Button br='$3' flex={1} onPress={handleEnable} disabled={isLoading} theme="green">
          {isLoading ? 'Enabling...' : 'Enable'}
        </Button>
        <Button br='$3' flex={1} onPress={handleDismiss} theme="gray" chromeless>
          Not now
        </Button>
      </XStack>
    </YStack>
  )
}
