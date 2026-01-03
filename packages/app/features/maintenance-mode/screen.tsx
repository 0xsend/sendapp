import { IconSendLogo } from 'app/components/icons'
import { type ReactNode, useEffect, useRef } from 'react'
import { YStack, H1, H2 } from 'tamagui'
import { useTranslation } from 'react-i18next'
import { useAnalytics } from 'app/provider/analytics'

/**
 * This screen is used to display a maintenance mode screen.
 *
 * TODO: this will not work on native, add an API route to check for maintenance mode
 */
export function MaintenanceModeScreen({ children }: { children: ReactNode }) {
  const { t } = useTranslation('maintenance')
  const analytics = useAnalytics()
  const hasTrackedView = useRef(false)
  const isMaintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true'

  // Track maintenance_viewed when in maintenance mode
  useEffect(() => {
    if (isMaintenanceMode && !hasTrackedView.current) {
      analytics.capture({
        name: 'maintenance_viewed',
        properties: {},
      })
      hasTrackedView.current = true
    }
  }, [isMaintenanceMode, analytics])

  if (isMaintenanceMode) {
    return (
      <YStack
        p="$4"
        ai="center"
        jc="center"
        w="100%"
        h="100%"
        $gtMd={{
          p: '$6',
          ai: 'flex-start',
          jc: 'flex-start',
        }}
      >
        <IconSendLogo size={'$2.5'} color="$color12" />
        <H1 $gtMd={{ size: '$8' }} size="$4" fontWeight={'300'} color="$color12">
          {t('title')}
        </H1>
        <H2 $gtMd={{ size: '$6' }} size="$4" fontWeight={'300'} color="$color12">
          {t('subtitle')}
        </H2>
      </YStack>
    )
  }
  return children
}
