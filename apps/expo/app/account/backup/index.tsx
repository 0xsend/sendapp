import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Stack } from 'expo-router'
import { BackupScreen } from 'app/features/account/backup'
import { useTranslation } from 'react-i18next'

export default function PasskeysScreen() {
  const { t } = useTranslation('navigation')

  return (
    <>
      <Stack.Screen
        options={{
          title: t('stack.account.passkeys'),
        }}
      />
      <ScreenContainer>
        <BackupScreen />
      </ScreenContainer>
    </>
  )
}
