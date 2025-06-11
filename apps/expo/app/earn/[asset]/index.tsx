import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Stack } from 'expo-router'
import { SendEarnProvider } from 'app/features/earn/providers/SendEarnProvider'
import { ActiveEarningsScreen } from 'app/features/earn/active/screen'

export default function SavingsAssetScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Details',
        }}
      />
      <ScreenContainer>
        <SendEarnProvider>
          <ActiveEarningsScreen />
        </SendEarnProvider>
      </ScreenContainer>
    </>
  )
}
