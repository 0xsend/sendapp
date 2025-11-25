import { LinkBanner, YStack } from '@my/ui'
import { useTranslation } from 'react-i18next'

export const InvestScreen = () => {
  const { t } = useTranslation('invest')

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
