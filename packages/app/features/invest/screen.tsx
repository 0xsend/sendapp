import { LinkBanner, YStack } from '@my/ui'
import { useTranslation } from 'react-i18next'
import { useEffect, useRef } from 'react'
import { useAnalytics } from 'app/provider/analytics'

export const InvestScreen = () => {
  const { t } = useTranslation('invest')
  const analytics = useAnalytics()
  const hasTrackedView = useRef(false)

  // Track invest_viewed on mount
  useEffect(() => {
    if (!hasTrackedView.current) {
      analytics.capture({
        name: 'invest_viewed',
        properties: {},
      })
      hasTrackedView.current = true
    }
  }, [analytics])

  return (
    <YStack
      w={'100%'}
      gap="$5"
      pb={'$3.5'}
      $gtLg={{
        w: '50%',
      }}
    >
      <LinkBanner
        href={'/earn'}
        imgUrl={'https://ghassets.send.app/app_images/deposit.jpg'}
        title={t('banner.title')}
        subtitle={t('banner.subtitle')}
        backgroundPosition={'center 15%'}
      />
    </YStack>
  )
}
