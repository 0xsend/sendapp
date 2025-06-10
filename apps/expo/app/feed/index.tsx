import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Stack } from 'expo-router'
import { ComingSoon } from 'app/components/ComingSoon'

export default function FeedScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Community Feed',
        }}
      />
      <ScreenContainer>
        <ComingSoon />
      </ScreenContainer>
    </>
  )
}
