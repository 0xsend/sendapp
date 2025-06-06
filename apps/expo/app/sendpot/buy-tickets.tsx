import { Stack } from 'expo-router/build/layouts/Stack'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Paragraph } from '@my/ui'

export default function BuySendpotTicketsScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Buy Tickets',
        }}
      />
      <ScreenContainer>
        <Paragraph>BuySendpotTicketsScreen</Paragraph>
      </ScreenContainer>
    </>
  )
}
