import { Stack } from 'expo-router/build/layouts/Stack'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Paragraph } from '@my/ui'

export default function SuccessDepositScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Success Deposit',
        }}
      />
      <ScreenContainer>
        <Paragraph>SuccessDepositScreen</Paragraph>
      </ScreenContainer>
    </>
  )
}
