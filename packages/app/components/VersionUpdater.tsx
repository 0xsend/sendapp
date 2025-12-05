import { AnimatePresence, Button, Dialog, H2, Paragraph, YStack } from '@my/ui'
import { Rocket } from '@tamagui/lucide-icons'
import { useVersionUpdater } from 'app/utils/useVersionUpdater'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * Component that checks for version updates and prompts users to refresh.
 *
 * Web-only: This component polls the /api/version endpoint to detect when
 * a new version has been deployed. When a mismatch is detected, it shows
 * a blocking modal dialog that forces the user to refresh.
 *
 * The dialog is non-dismissible to prevent users from continuing with stale
 * code that could cause errors or unexpected behavior.
 *
 * For native, use VersionUpdater.native.tsx which returns null.
 *
 * Based on the pattern from packages/app/features/sendpot/SendpotRiskDialog.tsx
 *
 * @param props Configuration options
 */
export function VersionUpdater(props: { intervalTimeInSeconds?: number }) {
  const { data } = useVersionUpdater(props)
  const [isOpen, setIsOpen] = useState(false)
  const { t } = useTranslation('common')

  useEffect(() => {
    setIsOpen(data?.didChange ?? false)
  }, [data?.didChange])

  const handleRefresh = () => {
    window.location.reload()
  }

  // Don't render if no version change detected
  if (!data?.didChange) {
    return null
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog open={isOpen} modal>
          <Dialog.Portal>
            <Dialog.Overlay
              key="version-updater-overlay"
              animation="100ms"
              opacity={0.75}
              enterStyle={{ opacity: 0 }}
              exitStyle={{ opacity: 0 }}
            />
            <Dialog.Content
              key="version-updater-dialog"
              elevation="$9"
              shadowOpacity={0.4}
              animation="responsive"
              animateOnly={['opacity', 'transform']}
              enterStyle={{ opacity: 0, scale: 0.98, y: -10 }}
              exitStyle={{ opacity: 0, scale: 0.98, y: 10 }}
              gap="$5"
              maxWidth="90%"
              $gtMd={{ maxWidth: 420 }}
              padding="$6"
              br="$6"
            >
              <YStack gap="$5" testID="versionUpdaterDialog" ai="center">
                {/* Icon container with brand green background */}
                <Rocket size={45} color="$gray10" />

                {/* Title and description */}
                <YStack gap="$3" ai="center">
                  <H2 size="$8" ta="center" fontWeight="600">
                    {t('versionUpdater.title')}
                  </H2>
                  <Paragraph color="$gray10" size="$5" ta="center" maxWidth={340} lineHeight="$5">
                    {t('versionUpdater.description')}
                  </Paragraph>
                </YStack>

                {/* Action button */}
                <Button
                  testID="versionUpdaterRefreshButton"
                  backgroundColor="$neon7"
                  size="$5"
                  onPress={handleRefresh}
                  br="$4"
                  w="100%"
                  maxWidth={280}
                  fontWeight="600"
                  borderWidth={0}
                  pressStyle={{ scale: 0.98, backgroundColor: '$neon7' }}
                  hoverStyle={{ backgroundColor: '$neon6' }}
                  focusStyle={{ outlineWidth: 0 }}
                  animation="responsive"
                  animateOnly={['transform', 'opacity']}
                >
                  <Button.Text
                    color="$gray1"
                    $theme-light={{ color: '$gray12' }}
                    fontSize="$5"
                    fontWeight="500"
                  >
                    {t('versionUpdater.actions.refresh')}
                  </Button.Text>
                </Button>
              </YStack>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog>
      )}
    </AnimatePresence>
  )
}
