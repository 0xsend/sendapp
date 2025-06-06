import { Stack } from 'expo-router/build/layouts/Stack'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Paragraph } from '@my/ui'

export default function CheckoutSendtagsScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Checkout',
        }}
      />
      <ScreenContainer>
        <Paragraph>CheckoutSendtagsScreen</Paragraph>
      </ScreenContainer>
    </>
  )
}
