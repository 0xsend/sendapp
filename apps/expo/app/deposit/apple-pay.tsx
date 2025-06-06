import { Stack as StackRouter } from 'expo-router/build/layouts/Stack'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Paragraph } from '@my/ui'

export default function ApplePayDepositScreen() {
  return (
    <>
      <StackRouter.Screen
        options={{
          title: 'Apple Pay',
        }}
      />
      <ScreenContainer>
        <Paragraph>ApplePayDepositScreen</Paragraph>
      </ScreenContainer>
    </>
  )
}
