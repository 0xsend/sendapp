import { Stack } from 'expo-router/build/layouts/Stack'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { FirstSendtagScreen } from 'app/features/account/sendtag/first/FirstSendtagScreen'
import { useTranslation } from 'react-i18next'

export default function Screen() {
  const { t } = useTranslation('navigation')

  return (
    <>
      <Stack.Screen
        options={{
          title: t('stack.account.sendtagsFirst'),
        }}
      />
      <ScreenContainer>
        <FirstSendtagScreen />
      </ScreenContainer>
    </>
  )
}
