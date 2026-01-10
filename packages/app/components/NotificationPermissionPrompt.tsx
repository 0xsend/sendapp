import { Button, H2, Paragraph, Sheet, Spinner, XStack, YStack } from '@my/ui'
import { Bell, X } from '@tamagui/lucide-icons'
import { useNotifications } from 'app/utils/useNotifications'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Platform } from 'react-native'
import * as Device from 'expo-device'
import * as Notifications from 'expo-notifications'
import { useSessionContext } from 'app/utils/supabase/useSessionContext'
import AsyncStorage from '@react-native-async-storage/async-storage'

const PROMPT_DISMISSED_KEY = 'notification_prompt_dismissed'
const PROMPT_COOLDOWN_DAYS = 7

interface NotificationPermissionPromptProps {
  /** Delay before showing prompt (ms). Default: 3000 */
  delayMs?: number
  /** Whether to show immediately (bypasses delay). Default: false */
  immediate?: boolean
}

/**
 * Sheet component that prompts users to enable push notifications.
 *
 * Shows only when:
 * - User is authenticated
 * - Running on a physical device
 * - Permissions are not yet granted
 * - User hasn't dismissed recently (cooldown)
 */
export function NotificationPermissionPrompt({
  delayMs = 3000,
  immediate = false,
}: NotificationPermissionPromptProps) {
  const { t } = useTranslation('common')
  const { session } = useSessionContext()
  const { isEnabled, permissionStatus, isRequestingPermission, requestPermissions } =
    useNotifications({ autoRegister: true })

  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [shouldShow, setShouldShow] = useState(false)

  // Check if we should show the prompt
  useEffect(() => {
    const checkShouldShow = async () => {
      // Don't show if not on device or not authenticated
      if (!Device.isDevice || !session?.user?.id) {
        setShouldShow(false)
        return
      }

      // Don't show if permissions already granted
      if (isEnabled) {
        setShouldShow(false)
        return
      }

      // Don't show if permissions explicitly denied (user must go to settings)
      if (permissionStatus === Notifications.PermissionStatus.DENIED) {
        setShouldShow(false)
        return
      }

      // Check if user dismissed recently
      try {
        const dismissedAt = await AsyncStorage.getItem(PROMPT_DISMISSED_KEY)
        if (dismissedAt) {
          const dismissedDate = new Date(dismissedAt)
          const daysSinceDismissed = (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24)
          if (daysSinceDismissed < PROMPT_COOLDOWN_DAYS) {
            setShouldShow(false)
            return
          }
        }
      } catch {
        // Ignore storage errors
      }

      setShouldShow(true)
    }

    void checkShouldShow()
  }, [session?.user?.id, isEnabled, permissionStatus])

  // Show prompt after delay
  useEffect(() => {
    if (!shouldShow) {
      setIsOpen(false)
      return
    }

    if (immediate) {
      setIsOpen(true)
      return
    }

    const timer = setTimeout(() => {
      setIsOpen(true)
    }, delayMs)

    return () => clearTimeout(timer)
  }, [shouldShow, immediate, delayMs])

  const handleEnable = useCallback(async () => {
    setIsLoading(true)
    try {
      const granted = await requestPermissions()
      if (granted) {
        setIsOpen(false)
      }
    } finally {
      setIsLoading(false)
    }
  }, [requestPermissions])

  const handleDismiss = useCallback(async () => {
    // Record dismissal time for cooldown
    try {
      await AsyncStorage.setItem(PROMPT_DISMISSED_KEY, new Date().toISOString())
    } catch {
      // Ignore storage errors
    }
    setIsOpen(false)
    setShouldShow(false)
  }, [])

  // Don't render on web
  if (Platform.OS === 'web') {
    return null
  }

  return (
    <Sheet
      open={isOpen}
      onOpenChange={setIsOpen}
      modal
      dismissOnSnapToBottom
      snapPoints={[50]}
      animation="200ms"
      zIndex={99_000}
    >
      <Sheet.Overlay
        key="notification-prompt-overlay"
        animation="100ms"
        opacity={0.5}
        enterStyle={{ opacity: 0 }}
        exitStyle={{ opacity: 0 }}
      />
      <Sheet.Frame
        key="notification-prompt-frame"
        padding="$6"
        gap="$5"
        backgroundColor="$background"
        borderTopLeftRadius="$6"
        borderTopRightRadius="$6"
      >
        <XStack jc="flex-end">
          <Button
            size="$3"
            circular
            chromeless
            onPress={handleDismiss}
            icon={<X size={20} color="$gray10" />}
            testID="notificationPromptCloseButton"
          />
        </XStack>

        <YStack gap="$5" ai="center" testID="notificationPermissionPrompt">
          <YStack
            w={72}
            h={72}
            br={36}
            ai="center"
            jc="center"
            backgroundColor="$neon7"
            opacity={0.9}
          >
            <Bell size={36} color="$gray1" />
          </YStack>

          <YStack gap="$3" ai="center">
            <H2 size="$8" ta="center" fontWeight="600">
              {t('notifications.prompt.title', 'Stay Updated')}
            </H2>
            <Paragraph color="$gray10" size="$5" ta="center" maxWidth={340} lineHeight="$5">
              {t(
                'notifications.prompt.description',
                'Enable notifications to know when you receive money and stay up to date with your account.'
              )}
            </Paragraph>
          </YStack>

          <YStack gap="$3" w="100%">
            <Button
              testID="notificationPromptEnableButton"
              backgroundColor="$neon7"
              size="$5"
              onPress={handleEnable}
              br="$4"
              w="100%"
              fontWeight="600"
              borderWidth={0}
              pressStyle={{ scale: 0.98, backgroundColor: '$neon7' }}
              disabled={isLoading || isRequestingPermission}
              animation="responsive"
              animateOnly={['transform', 'opacity']}
            >
              {isLoading || isRequestingPermission ? (
                <Spinner size="small" color="$gray1" />
              ) : (
                <Button.Text
                  color="$gray1"
                  $theme-light={{ color: '$gray12' }}
                  fontSize="$5"
                  fontWeight="500"
                >
                  {t('notifications.prompt.enable', 'Enable Notifications')}
                </Button.Text>
              )}
            </Button>

            <Button
              testID="notificationPromptDismissButton"
              chromeless
              size="$4"
              onPress={handleDismiss}
              w="100%"
            >
              <Button.Text color="$gray10" fontSize="$4">
                {t('notifications.prompt.later', 'Maybe Later')}
              </Button.Text>
            </Button>
          </YStack>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  )
}
