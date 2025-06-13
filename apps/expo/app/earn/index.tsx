import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Stack } from 'expo-router'
import { SendEarnProvider } from 'app/features/earn/providers/SendEarnProvider'
import { EarnScreen } from 'app/features/earn/screen'

export default function SavingsScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Savings',
        }}
      />
      <ScreenContainer>
        <SendEarnProvider>
          <EarnScreen />
        </SendEarnProvider>
      </ScreenContainer>
    </>
  )
}
