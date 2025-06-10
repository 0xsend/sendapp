import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Stack } from 'expo-router'
import { BackupScreen } from 'app/features/account/backup'

export default function PasskeysScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Passkeys',
        }}
      />
      <ScreenContainer>
        <BackupScreen />
      </ScreenContainer>
    </>
  )
}
