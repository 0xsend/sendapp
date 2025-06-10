import { Stack } from 'expo-router/build/layouts/Stack'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { FirstSendtagScreen } from 'app/features/account/sendtag/first/FirstSendtagScreen'

export default function Screen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'First Sendtag',
        }}
      />
      <ScreenContainer>
        <FirstSendtagScreen />
      </ScreenContainer>
    </>
  )
}
