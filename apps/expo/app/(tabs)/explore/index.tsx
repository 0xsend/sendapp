import { Stack } from 'expo-router'
import { TabScreenContainer } from 'apps-expo/components/layout/TabScreenContainer'
import { ExploreScreen } from 'app/features/explore/screen'

export default function Screen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Explore',
        }}
      />
      <TabScreenContainer>
        <ExploreScreen />
      </TabScreenContainer>
    </>
  )
}
