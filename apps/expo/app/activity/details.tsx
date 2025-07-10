import { ScreenContainer } from 'apps-expo/components/layout/ScreenContainer'
import { Stack } from 'expo-router'
import { ActivityDetails } from 'app/features/activity/ActivityDetails'

export default function ActivityDetailsScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Transaction details',
        }}
      />
      <ScreenContainer>
        <ActivityDetails />
      </ScreenContainer>
    </>
  )
}
