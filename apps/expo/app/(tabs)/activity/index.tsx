import { Paragraph } from '@my/ui'
import { TabScreenContainer } from 'apps-expo/components/layout/TabScreenContainer'
import { Stack } from 'expo-router/build/layouts/Stack'

export default function ActivityTabScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Activity',
        }}
      />
      <TabScreenContainer>
        <Paragraph>ActivityTabScreen</Paragraph>
      </TabScreenContainer>
    </>
  )
}
