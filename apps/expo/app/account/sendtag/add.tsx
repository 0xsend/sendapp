import { Stack } from 'expo-router/build/layouts/Stack'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { AddSendtagsScreen } from 'app/features/account/sendtag/add/AddSendtagsScreen'
import { useTranslation } from 'react-i18next'

export default function Screen() {
  const { t } = useTranslation('navigation')

  return (
    <>
      <Stack.Screen
        options={{
          title: t('stack.account.sendtagsAdd'),
        }}
      />
      <ScreenContainer>
        <AddSendtagsScreen />
      </ScreenContainer>
    </>
  )
}
