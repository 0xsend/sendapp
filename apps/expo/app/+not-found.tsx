import { Stack } from 'expo-router/build/layouts/Stack'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Paragraph } from '@my/ui'
import { useTranslation } from 'react-i18next'

export default function NotFoundScreen() {
  const { t } = useTranslation('navigation')

  return (
    <>
      <Stack.Screen
        options={{
          title: t('stack.notFound'),
        }}
      />
      <ScreenContainer>
        <Paragraph>NotFoundScreen</Paragraph>
      </ScreenContainer>
    </>
  )
}
