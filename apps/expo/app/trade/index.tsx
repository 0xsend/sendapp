import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Stack } from 'expo-router'
import { SwapFormScreen } from 'app/features/swap/form/screen'

export default function TradeScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Trade',
        }}
      />
      <ScreenContainer>
        <SwapFormScreen />
      </ScreenContainer>
    </>
  )
}
