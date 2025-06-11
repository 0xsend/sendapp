import { TabScreenContainer } from 'apps-expo/components/layout/TabScreenContainer'
import { Stack } from 'expo-router/build/layouts/Stack'
import { ActivityScreen } from 'app/features/activity/screen'

export default function ActivityTabScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Activity',
        }}
      />
      <TabScreenContainer>
        <ActivityScreen />
      </TabScreenContainer>
    </>
  )
}
