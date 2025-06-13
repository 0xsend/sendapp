import { Stack } from 'expo-router/build/layouts/Stack'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { SendEarnProvider } from 'app/features/earn/providers/SendEarnProvider'
import { WithdrawForm } from 'app/features/earn/withdraw/screen'

export default function WithdrawAssetSavingsScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Withdraw Savings',
        }}
      />
      <ScreenContainer>
        <SendEarnProvider>
          <WithdrawForm />
        </SendEarnProvider>
      </ScreenContainer>
    </>
  )
}
