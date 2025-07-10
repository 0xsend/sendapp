import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Stack } from 'expo-router'
import { SendAmountForm } from 'app/features/send/SendAmountForm'

export default function SendFormScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Enter Amount',
        }}
      />
      <ScreenContainer>
        <SendAmountForm />
      </ScreenContainer>
    </>
  )
}
