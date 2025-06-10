import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Stack } from 'expo-router'
import { SendTagScreen } from 'app/features/account/sendtag/screen'

export default function SendtagsScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Sendtags',
        }}
      />
      <ScreenContainer>
        <SendTagScreen />
      </ScreenContainer>
    </>
  )
}
