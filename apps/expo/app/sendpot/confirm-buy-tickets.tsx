import { Stack } from 'expo-router/build/layouts/Stack'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { ConfirmBuyTicketsScreen } from 'app/features/sendpot/ConfirmBuyTicketsScreen'

export default function ConfirmBuySendpotTicketsScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Summary',
        }}
      />
      <ScreenContainer>
        <ConfirmBuyTicketsScreen />
      </ScreenContainer>
    </>
  )
}
