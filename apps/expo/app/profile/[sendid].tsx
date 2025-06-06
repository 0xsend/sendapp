import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Stack as StackRouter } from 'expo-router'
import { Paragraph } from '@my/ui'

export default function ProfileScreen() {
  return (
    <>
      <StackRouter.Screen
        options={{
          title: 'History',
        }}
      />
      <ScreenContainer>
        <Paragraph>History</Paragraph>
      </ScreenContainer>
    </>
  )
}
