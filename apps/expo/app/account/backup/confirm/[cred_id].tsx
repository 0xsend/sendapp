import { Stack } from 'expo-router/build/layouts/Stack'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { ConfirmPasskeyScreen } from 'app/features/account/backup/confirm'
import { useTranslation } from 'react-i18next'

export default function Screen() {
  const { t } = useTranslation('navigation')

  return (
    <>
      <Stack.Screen
        options={{
          title: t('stack.account.passkeysConfirm'),
        }}
      />
      <ScreenContainer>
        <ConfirmPasskeyScreen />
      </ScreenContainer>
    </>
  )
}
