import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Stack as StackRouter } from 'expo-router'
import { Paragraph } from '@my/ui'

export default function FeedScreen() {
  return (
    <>
      <StackRouter.Screen
        options={{
          title: 'Community Feed',
        }}
      />
      <ScreenContainer>
        <Paragraph>Community Feed</Paragraph>
      </ScreenContainer>
    </>
  )
}
