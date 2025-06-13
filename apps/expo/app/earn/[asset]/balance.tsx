import { Stack } from 'expo-router/build/layouts/Stack'
import { SendEarnProvider } from 'app/features/earn/providers/SendEarnProvider'
import { EarningsBalance } from 'app/features/earn/earnings/screen'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'

export default function BalanceAssetSavingsScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Balance',
        }}
      />
      <ScreenContainer>
        <SendEarnProvider>
          <EarningsBalance />
        </SendEarnProvider>
      </ScreenContainer>
    </>
  )
}
