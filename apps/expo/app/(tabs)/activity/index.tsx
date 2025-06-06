import { Paragraph } from '@my/ui'
import { TabScreenContainer } from 'apps-expo/components/layout/TabScreenContainer'
import { Stack as StackRouter } from 'expo-router/build/layouts/Stack'

export default function ActivityTabScreen() {
  return (
    <>
      <StackRouter.Screen
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
