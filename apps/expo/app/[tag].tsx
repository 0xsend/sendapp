import { Stack } from 'expo-router/build/layouts/Stack'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Paragraph } from '@my/ui'

export default function TagScreenScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'History',
        }}
      />
      <ScreenContainer>
        <Paragraph>TagScreenScreen</Paragraph>
      </ScreenContainer>
    </>
  )
}
