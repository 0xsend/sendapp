import { Stack as StackRouter } from 'expo-router/build/layouts/Stack'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Paragraph } from '@my/ui'

export default function AddSendtagsScreen() {
  return (
    <>
      <StackRouter.Screen
        options={{
          title: 'Register Sendtags',
        }}
      />
      <ScreenContainer>
        <Paragraph>AddSendtagsScreen</Paragraph>
      </ScreenContainer>
    </>
  )
}
