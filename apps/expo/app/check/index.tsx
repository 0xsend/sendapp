import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Stack } from 'expo-router'
import { CheckScreen } from 'app/features/check/screen'
import { useTranslation } from 'react-i18next'

export default function Screen() {
  const { t } = useTranslation('navigation')

  return (
    <>
      <Stack.Screen
        options={{
          title: t('stack.check.root'),
        }}
      />
      <ScreenContainer>
        <CheckScreen />
      </ScreenContainer>
    </>
  )
}
