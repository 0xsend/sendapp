import { Container, H1, H2, YStack, LinkableButton } from '@my/ui'
import { useTranslation } from 'react-i18next'

export function UnknownScreen() {
  const { t } = useTranslation('unknown')
  return (
    <Container>
      <YStack jc={'center'} alignItems="center" f={1} gap="$6">
        <H1>{t('title')}</H1>
        <H2>{t('subtitle')}</H2>
        <LinkableButton href="/">{t('cta')}</LinkableButton>
      </YStack>
    </Container>
  )
}
