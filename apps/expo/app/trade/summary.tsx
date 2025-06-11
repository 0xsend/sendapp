import { Stack } from 'expo-router/build/layouts/Stack'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { SwapSummaryScreen } from 'app/features/swap/summary/screen'

export default function TradeSummaryScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Trade summary',
        }}
      />
      <ScreenContainer>
        <SwapSummaryScreen />
      </ScreenContainer>
    </>
  )
}
