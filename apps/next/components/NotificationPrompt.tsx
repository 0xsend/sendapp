'use client'

import { useWebPush } from './WebPushSubscription'
import { Button, YStack, XStack, Text, Paragraph } from '@my/ui'
import { Bell } from '@tamagui/lucide-icons'
import { useState } from 'react'

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
  if (!isSupported || permission !== 'prompt' || dismissed) {
    return null
  }

  return (
    <YStack
      padding="$4"
      backgroundColor="$background"
      borderRadius="$4"
      borderWidth={1}
      borderColor="$borderColor"
      gap="$3"
      shadowColor="$shadowColor"
      shadowRadius={8}
      shadowOffset={{ width: 0, height: 2 }}
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
        <Button flex={1} onPress={handleEnable} disabled={isLoading} theme="green">
          {isLoading ? 'Enabling...' : 'Enable'}
        </Button>
        <Button flex={1} onPress={handleDismiss} theme="gray" chromeless>
          Not now
        </Button>
      </XStack>
    </YStack>
  )
}
