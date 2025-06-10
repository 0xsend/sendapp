import { Stack } from 'expo-router/build/layouts/Stack'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { CreatePasskeyScreen } from 'app/features/account/backup/create'

export default function Screen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Create Passkey',
        }}
      />
      <ScreenContainer>
        <CreatePasskeyScreen />
      </ScreenContainer>
    </>
  )
}
