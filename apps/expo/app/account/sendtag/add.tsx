import { Stack } from 'expo-router/build/layouts/Stack'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { AddSendtagsScreen } from 'app/features/account/sendtag/add/AddSendtagsScreen'

export default function Screen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Register Sendtags',
        }}
      />
      <ScreenContainer>
        <AddSendtagsScreen />
      </ScreenContainer>
    </>
  )
}
