import { Stack } from 'expo-router/build/layouts/Stack'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { BuyTicketsScreen } from 'app/features/sendpot/BuyTicketsScreen'

export default function BuySendpotTicketsScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Buy Tickets',
        }}
      />
      <ScreenContainer>
        <BuyTicketsScreen />
      </ScreenContainer>
    </>
  )
}
