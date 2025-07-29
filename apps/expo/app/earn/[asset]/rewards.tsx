import { Stack } from 'expo-router/build/layouts/Stack'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { SendEarnProvider } from 'app/features/earn/providers/SendEarnProvider'
import { RewardsBalanceScreen } from 'app/features/earn/rewards/screen'

export default function RewardsBalance() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Rewards Balance',
        }}
      />
      <ScreenContainer>
        <SendEarnProvider>
          <RewardsBalanceScreen />
        </SendEarnProvider>
      </ScreenContainer>
    </>
  )
}
