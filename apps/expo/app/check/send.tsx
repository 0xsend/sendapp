import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Stack } from 'expo-router'
import { CheckSendScreen } from 'app/features/check/send/screen'
import { useTranslation } from 'react-i18next'

export default function Screen() {
  const { t } = useTranslation('navigation')

  return (
    <>
      <Stack.Screen
        options={{
          title: t('stack.check.send'),
        }}
      />
      <ScreenContainer>
        <CheckSendScreen />
      </ScreenContainer>
    </>
  )
}
