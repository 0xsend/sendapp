import { Stack } from 'expo-router/build/layouts/Stack'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Paragraph } from '@my/ui'

export default function FirstSendtagScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'First Sendtag',
        }}
      />
      <ScreenContainer>
        <Paragraph>FirstSendtagScreen</Paragraph>
      </ScreenContainer>
    </>
  )
}
