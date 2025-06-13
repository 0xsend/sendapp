import { Stack } from 'expo-router/build/layouts/Stack'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { DepositScreen } from 'app/features/earn/deposit/screen'
import { SendEarnProvider } from 'app/features/earn/providers/SendEarnProvider'

export default function DepositAssetSavingsScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Deposit',
        }}
      />
      <ScreenContainer>
        <SendEarnProvider>
          <DepositScreen />
        </SendEarnProvider>
      </ScreenContainer>
    </>
  )
}
