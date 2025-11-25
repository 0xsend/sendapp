import { Check } from '@tamagui/lucide-icons'
import { FadeCard, Paragraph, PrimaryButton, YStack } from '@my/ui'
import { Platform } from 'react-native'
import { useLink } from 'solito/link'
import { useTranslation } from 'react-i18next'

export function DepositSuccessScreen() {
  const linkProps = useLink({ href: Platform.OS === 'web' ? '/deposit' : '/(tabs)/home' })
  const { t } = useTranslation('deposit')

  return (
    <YStack
      w={'100%'}
      gap="$5"
      py={'$3.5'}
      jc={'space-between'}
      $gtLg={{
        w: '50%',
      }}
    >
      <FadeCard ai={'center'}>
        <Check size={'$3'} color={'$primary'} $theme-light={{ color: '$color12' }} />
        <YStack ai={'center'} gap={'$2'}>
          <Paragraph size={'$8'} fontWeight={500} ta={'center'} $gtLg={{ size: '$9' }}>
            {t('success.title')}
          </Paragraph>
          <Paragraph
            size={'$5'}
            ta={'center'}
            color={'$lightGrayTextField'}
            $theme-light={{ color: '$darkGrayTextField' }}
          >
            {t('success.description')}
          </Paragraph>
        </YStack>
        <PrimaryButton {...linkProps}>
          <PrimaryButton.Text>
            {Platform.OS === 'web'
              ? t('success.actions.depositAgain')
              : t('success.actions.continue')}
          </PrimaryButton.Text>
        </PrimaryButton>
      </FadeCard>
    </YStack>
  )
}
