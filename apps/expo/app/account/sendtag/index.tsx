import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Stack } from 'expo-router'
import { SendTagScreen } from 'app/features/account/sendtag/screen'
import { useTranslation } from 'react-i18next'

export default function SendtagsScreen() {
  const { t } = useTranslation('navigation')

  return (
    <>
      <Stack.Screen
        options={{
          title: t('stack.account.sendtags'),
        }}
      />
      <ScreenContainer>
        <SendTagScreen />
      </ScreenContainer>
    </>
  )
}
