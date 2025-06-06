import { Stack as StackRouter } from 'expo-router/build/layouts/Stack'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Paragraph } from '@my/ui'

export default function DebitCardDepositScreen() {
  return (
    <>
      <StackRouter.Screen
        options={{
          title: 'Debit Card',
        }}
      />
      <ScreenContainer>
        <Paragraph>DebitCardDepositScreen</Paragraph>
      </ScreenContainer>
    </>
  )
}
