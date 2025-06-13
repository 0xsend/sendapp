import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Stack } from 'expo-router'
import { ProfileScreen } from 'app/features/profile/screen'

export default function Screen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'History',
        }}
      />
      <ScreenContainer>
        <ProfileScreen />
      </ScreenContainer>
    </>
  )
}
