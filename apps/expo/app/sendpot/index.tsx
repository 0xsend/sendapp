import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Stack } from 'expo-router'
import { SendPotScreen } from 'app/features/sendpot/screen'

export default function SendpotScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Sendpot',
        }}
      />
      <ScreenContainer>
        <SendPotScreen />
      </ScreenContainer>
    </>
  )
}
