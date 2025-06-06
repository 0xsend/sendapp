import { Stack } from 'expo-router/build/layouts/Stack'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Paragraph } from '@my/ui'

export default function PersonalInfoScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Personal information',
        }}
      />
      <ScreenContainer>
        <Paragraph>personal info screen</Paragraph>
      </ScreenContainer>
    </>
  )
}
