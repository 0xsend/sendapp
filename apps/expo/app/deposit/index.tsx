import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Stack } from 'expo-router'
import { DepositScreen } from 'app/features/deposit/screen'

export default function Screen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Deposit',
        }}
      />
      <ScreenContainer>
        <DepositScreen />
      </ScreenContainer>
    </>
  )
}
