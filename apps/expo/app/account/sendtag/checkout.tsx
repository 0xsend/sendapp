import { Stack } from 'expo-router/build/layouts/Stack'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { CheckoutScreen } from 'app/features/account/sendtag/checkout/screen'

export default function CheckoutSendtagsScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Checkout',
        }}
      />
      <ScreenContainer>
        <CheckoutScreen />
      </ScreenContainer>
    </>
  )
}
