import { Stack } from 'expo-router/build/layouts/Stack'
import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import FriendsScreen from 'app/features/affiliate/screen'

export default function ReferralsScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Referrals',
        }}
      />
      <ScreenContainer>
        <FriendsScreen />
      </ScreenContainer>
    </>
  )
}
