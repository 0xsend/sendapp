import { LinkBanner, YStack } from '@my/ui'
import { Platform } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useEffect, useRef } from 'react'
import { useAnalytics } from 'app/provider/analytics'

export const ExploreScreen = ({ images }: { images: Record<string, string> }) => {
  const { t } = useTranslation('explore')
  const analytics = useAnalytics()
  const hasTrackedView = useRef(false)

  // Track explore_viewed on mount
  useEffect(() => {
    if (!hasTrackedView.current) {
      analytics.capture({
        name: 'explore_viewed',
        properties: {},
      })
      hasTrackedView.current = true
    }
  }, [analytics])

  return (
    <YStack
      w={'100%'}
      gap="$3.5"
      pb={'$3.5'}
      mt={'$3'}
      $gtLg={{
        w: '50%',
        mt: 0,
        gap: '$5',
      }}
    >
      <LinkBanner
        href={'/rewards'}
        imgUrl={images.rewards || ''}
        title={t('banner.rewards.title')}
        subtitle={t('banner.rewards.subtitle')}
      />
      {Platform.OS === 'web' && (
        <LinkBanner
          href={'/sendpot'}
          imgUrl={images.sendpot || ''}
          title={t('banner.sendpot.title')}
          subtitle={t('banner.sendpot.subtitle')}
        />
      )}
      <LinkBanner
        href={'/canton-wallet'}
        imgUrl={images.cantonWallet || ''}
        title={t('banner.cantonWallet.title')}
        subtitle={t('banner.cantonWallet.subtitle')}
      />
    </YStack>
  )
}
