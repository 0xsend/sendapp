import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Stack } from 'expo-router'
import { Paragraph } from '@my/ui'

export default function FeedScreen() {
  return (
    <>
      <Stack.Screen
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
