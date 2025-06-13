import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Stack } from 'expo-router'
import { ActivityRewardsScreen } from 'app/features/explore/rewards/activity/screen'

export default function RewardsScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Rewards',
        }}
      />
      <ScreenContainer>
        <ActivityRewardsScreen />
      </ScreenContainer>
    </>
  )
}
