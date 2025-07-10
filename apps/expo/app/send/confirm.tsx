import { SendConfirmScreen } from 'app/features/send/confirm/screen'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Stack } from 'expo-router'

export default function SendConfirm() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Preview and Send',
        }}
      />
      <ScreenContainer>
        <SendConfirmScreen />
      </ScreenContainer>
    </>
  )
}
