import { Stack as StackRouter } from 'expo-router/build/layouts/Stack'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Paragraph } from '@my/ui'

export default function ConfirmPasskeyScreen() {
  return (
    <>
      <StackRouter.Screen
        options={{
          title: 'Confirm Passkey',
        }}
      />
      <ScreenContainer>
        <Paragraph>ConfirmPasskeyScreen</Paragraph>
      </ScreenContainer>
    </>
  )
}
