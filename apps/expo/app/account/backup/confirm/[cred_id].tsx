import { Stack } from 'expo-router/build/layouts/Stack'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { ConfirmPasskeyScreen } from 'app/features/account/backup/confirm'

export default function Screen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Confirm Passkey',
        }}
      />
      <ScreenContainer>
        <ConfirmPasskeyScreen />
      </ScreenContainer>
    </>
  )
}
