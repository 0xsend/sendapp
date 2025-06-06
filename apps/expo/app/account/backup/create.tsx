import { Stack } from 'expo-router/build/layouts/Stack'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Paragraph } from '@my/ui'

export default function CreatePasskeyScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Create Passkey',
        }}
      />
      <ScreenContainer>
        <Paragraph>CreatePasskeyScreen</Paragraph>
      </ScreenContainer>
    </>
  )
}
