import { Stack } from 'expo-router/build/layouts/Stack'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Paragraph } from '@my/ui'

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Not Found',
        }}
      />
      <ScreenContainer>
        <Paragraph>NotFoundScreen</Paragraph>
      </ScreenContainer>
    </>
  )
}
