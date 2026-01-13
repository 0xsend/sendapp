import { Button, H2, Paragraph, Sheet, Spinner, YStack } from '@my/ui'
import { Rocket } from '@tamagui/lucide-icons'
import { useExpoUpdates } from 'app/utils/useExpoUpdates'
import { useTranslation } from 'react-i18next'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useAnalytics } from 'app/provider/analytics'
import { useUser } from 'app/utils/useUser'

const REMIND_LATER_DELAY_MS = 5 * 60 * 1000 // 5 minutes
const APP_STORE_REVIEW_EMAIL = 'appreview@send.app'

/**
 * Native OTA update sheet component.
 *
 * Shows a dismissible bottom sheet when an OTA update has been downloaded.
 * The user can press "Update Now" to restart the app or dismiss to update later.
 * If dismissed, the sheet will reappear after REMIND_LATER_DELAY_MS.
 */
export function OTAUpdateSheet() {
  const { t } = useTranslation('common')
  const { isDownloaded, isDownloading, restartApp, error } = useExpoUpdates()
  const analytics = useAnalytics()
  const { user } = useUser()
  const hasTrackedPrompt = useRef(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const remindTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Don't show sheet for app store review account
  const isReviewAccount = user?.email === APP_STORE_REVIEW_EMAIL

  // Only show when update is downloaded, ready to apply, not dismissed, and not review account
  const isOpen = isDownloaded && !error && !isDismissed && !isReviewAccount

  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (remindTimerRef.current) {
        clearTimeout(remindTimerRef.current)
      }
    }
  }, [])

  const handleDismiss = useCallback(() => {
    setIsDismissed(true)

    // Set timer to show the sheet again
    remindTimerRef.current = setTimeout(() => {
      setIsDismissed(false)
      hasTrackedPrompt.current = false // Reset so we track the next prompt
    }, REMIND_LATER_DELAY_MS)
  }, [])

  // Track when update prompt is shown
  useEffect(() => {
    if (isOpen && !hasTrackedPrompt.current) {
      analytics.capture({
        name: 'ota_update_prompt_shown',
        properties: {},
      })
      hasTrackedPrompt.current = true
    }
  }, [isOpen, analytics])

  const handleRestartPress = () => {
    // Track restart clicked
    analytics.capture({
      name: 'ota_update_restart_clicked',
      properties: {},
    })
    void restartApp()
  }

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          handleDismiss()
        }
      }}
      modal
      dismissOnSnapToBottom
      dismissOnOverlayPress
      snapPoints={['fit']}
      snapPointsMode="fit"
      animation="200ms"
      zIndex={100_000}
    >
      <Sheet.Overlay
        key="ota-update-overlay"
        animation="100ms"
        opacity={0.75}
        enterStyle={{ opacity: 0 }}
        exitStyle={{ opacity: 0 }}
      />
      <Sheet.Frame
        key="ota-update-frame"
        padding="$6"
        gap="$5"
        backgroundColor="$background"
        borderTopLeftRadius="$6"
        borderTopRightRadius="$6"
      >
        <YStack gap="$5" ai="center" testID="otaUpdateSheet">
          <Rocket size={45} color="$gray10" />

          <YStack gap="$3" ai="center">
            <H2 size="$8" ta="center" fontWeight="600">
              {t('versionUpdater.title')}
            </H2>
            <Paragraph color="$gray10" size="$5" ta="center" maxWidth={340} lineHeight="$5">
              {t('versionUpdater.description')}
            </Paragraph>
          </YStack>

          <Button
            testID="otaUpdateRestartButton"
            backgroundColor="$neon7"
            size="$5"
            onPress={handleRestartPress}
            br="$4"
            w="100%"
            maxWidth={280}
            fontWeight="600"
            borderWidth={0}
            pressStyle={{ scale: 0.98, backgroundColor: '$neon7' }}
            disabled={isDownloading}
            animation="responsive"
            animateOnly={['transform', 'opacity']}
          >
            {isDownloading ? (
              <Spinner size="small" color="$gray1" />
            ) : (
              <Button.Text
                color="$gray1"
                $theme-light={{ color: '$gray12' }}
                fontSize="$5"
                fontWeight="500"
              >
                {t('versionUpdater.actions.refresh')}
              </Button.Text>
            )}
          </Button>
        </YStack>
      </Sheet.Frame>
    </Sheet>
  )
}
