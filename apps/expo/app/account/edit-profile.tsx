import { Stack as StackRouter } from 'expo-router/build/layouts/Stack'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Paragraph } from '@my/ui'

export default function ProfileScreen() {
  return (
    <>
      <StackRouter.Screen
        options={{
          title: 'Profile',
        }}
      />
      <ScreenContainer>
        <Paragraph>profile screen</Paragraph>
      </ScreenContainer>
    </>
  )
}
