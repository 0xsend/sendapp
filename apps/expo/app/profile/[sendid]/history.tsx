import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Stack } from 'expo-router'
import { ProfileHistoryScreen } from 'app/features/profile/history/screen'

export default function Screen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'History',
        }}
      />
      <ScreenContainer>
        <ProfileHistoryScreen />
      </ScreenContainer>
    </>
  )
}
