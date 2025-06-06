import { Stack } from 'expo-router/build/layouts/Stack'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Paragraph } from '@my/ui'

export default function ConfirmBuySendpotTicketsScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Buy Tickets Summary',
        }}
      />
      <ScreenContainer>
        <Paragraph>ConfirmBuySendpotTicketsScreen</Paragraph>
      </ScreenContainer>
    </>
  )
}
