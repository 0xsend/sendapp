import { Stack } from 'expo-router/build/layouts/Stack'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { DepositCoinbaseScreen } from 'app/features/deposit/DepositCoinbase/screen'

export default function DebitCardDepositScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Debit Card',
        }}
      />
      <ScreenContainer>
        <DepositCoinbaseScreen defaultPaymentMethod="CARD" />
      </ScreenContainer>
    </>
  )
}
