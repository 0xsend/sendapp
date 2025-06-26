import { Stack } from 'expo-router/build/layouts/Stack'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { DepositCoinbaseScreen } from 'app/features/deposit/DepositCoinbase/screen'

export default function ApplePayDepositScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Apple Pay',
        }}
      />
      <ScreenContainer>
        <DepositCoinbaseScreen defaultPaymentMethod="APPLE_PAY" />
      </ScreenContainer>
    </>
  )
}
